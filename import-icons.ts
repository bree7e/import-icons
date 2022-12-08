import fs from 'fs-extra';
import got from 'got';
import ora from 'ora';
import path from 'path';
import SVGO from 'svgo';

import downloadSVG from './utils/download-svg';
import getCommonFigmaJson from './utils/get-common-figma-json';
import parseArgs from './utils/parse-args';
import progress from './utils/progress-bar';
import removeDuplicates from './utils/remove-duplicates';
import transformElement from './utils/transform-element';
import { transformSvgContent } from './utils/transform-svg-content';

const spinner = ora('');

const figmaCfgPath = path.join(
  process.cwd(),
  parseArgs(process.argv.slice(0, -1), 'figmaPath') ?? 'figma.json'
);
const svgoCfgPath = path.join(
  process.cwd(),
  parseArgs(process.argv.slice(0, -1), 'svgoPath') ?? 'svgo.json'
);
const FIGMA_DOMAIN = 'https://api.figma.com';

let config;
try {
  config = require(figmaCfgPath).projects;
} catch {
  console.error('[ERROR]: Figma config not found!');
  fs.writeFileSync(figmaCfgPath, JSON.stringify(getCommonFigmaJson()));
  // tslint:disable-next-line: no-console
  console.info(`[INFO] ${figmaCfgPath} successfully created!`);
  process.exit(1);
}

let svgoCfg = {};
try {
  svgoCfg = require(svgoCfgPath);
} catch {
  console.warn(
    '[WARN] You did not provide svgo config, the default config will be used. \nMore detailed: https://github.com/svg/svgo'
  );
}
const svgo = new SVGO(svgoCfg);

const project = process.argv.slice().pop();
if (!project) {
  console.error(
    `[ERROR]: Project name not specified, start command 'npx import-icons {projectName}'`
  );
  process.exit(1);
}

let projectConfig;
try {
  if (!config[project]) {
    throw new Error(`Project with the name '${project}' not found`);
  }
  projectConfig = config[project].icons;
  if (!projectConfig) {
    throw new Error(`Project with the name '${project}' has an empty config`);
  }
} catch (e) {
  console.error(`[ERROR]: ${e}`);
  process.exit(1);
}

const outputDir = path.resolve(process.cwd(), `${projectConfig.outputDir}`);

let figmaFileKey: string, figmaToken: string;
let dCount = 0;
let oCount = 0;

/**
 * Get all elements from file
 */
const getFigmaElements = (): Promise<any[]> =>
  new Promise((resolve, reject) => {
    spinner.info('Getting elements from the figma file');
    spinner.start(`Contacting ${FIGMA_DOMAIN}`);
    got
      .get(`${FIGMA_DOMAIN}/v1/files/${figmaFileKey}`, {
        headers: { 'Content-Type': 'application/json', 'x-figma-token': figmaToken },
      })
      .then(response => {
        const data = JSON.parse(response.body);

        spinner.start(`Processing response`);
        const elements: any[] = [];
        const availableTypes: string[] = projectConfig.types ?? ['COMPONENT'];
        const namePattern: RegExp = projectConfig.namePattern
          ? new RegExp(projectConfig.namePattern)
          : null;

        const typeChecker = (type: string) => availableTypes.length > 0 ? availableTypes.includes(type) : true;

        const nameChecker = (name: string) => namePattern?.test(name) ?? true;

        const check = c => {
          if (typeChecker(c.type) && nameChecker(c.name)) {
            elements.push(c);
          } else if (c.children) {
            c.children.forEach(check);
          }
        };

        const iconPage = data.document.children.find(page => page.name === projectConfig.pageName);
        if (iconPage === undefined) {
          throw new Error(`The page with the name "${projectConfig.pageName}" was not found`);
        }
        const iconPageFrame = Boolean(projectConfig.frameName)
          ? iconPage.children.find(f => f.type === 'FRAME' && f.name === projectConfig.frameName)
          : iconPage;
        if (iconPageFrame === undefined) {
          throw new Error(`The frame with the name "${projectConfig.frameName}" was not found`);
        }
        iconPageFrame.children.forEach(check);
        return elements;
      })
      .then(elements => {
        spinner.succeed(`${elements.length} icons found in the figma file`);
        return resolve(elements);
      })
      .catch(err => {
        spinner.fail('Error: Getting icons from figma file');
        reject(err);
      });
  });

/**
 * Get upload urls for figma images
 * @param elementsIds - elements ids joined by ,
 */
const getFigmaImagesUrls = (elementsIds: string): Promise<any> =>
  new Promise((resolve, reject) => {
    const searchParams = new URLSearchParams([
      ['ids', elementsIds],
      ['format', 'svg'],
    ]);

    got
      .get(`${FIGMA_DOMAIN}/v1/images/${figmaFileKey}?${searchParams.toString()}`, {
        headers: { 'Content-Type': 'application/json', 'x-figma-token': figmaToken },
      })
      .then(response => {
        const body = JSON.parse(response.body);
        if (body.err) {
          reject(body.err);
        } else {
          resolve(body.images);
        }
      })
      .catch(err => {
        reject(err);
      });
  });

/////////// mAIN SCRIPT ////////////
try {
  spinner.info(`Extract figma file key and token for project ${project}`);
  figmaFileKey = projectConfig.url.match(/file\/([a-z0-9]+)\//i)[1];
  figmaToken = projectConfig.token;
  if (typeof projectConfig.token === 'undefined') {
    throw new Error('Not found figma token');
  }
  spinner.succeed(
    `Extracted for project ${project} \nfigma-key: ${figmaFileKey} \nfigma-token: ${figmaToken} \npage-name: ${projectConfig.pageName} \noutput directory: ${projectConfig.outputDir}`
  );
} catch (e) {
  spinner.fail(
    `Cannot find figma file key or token for project ${project} in figma.json! \nError: ${e}`
  );
  process.exit(1);
}

spinner.info(`Exporting icons from ${projectConfig.url}`);

// clear the build directory
Promise.resolve(fs.removeSync(outputDir))
  .then(() =>
    // get elements form figma
    getFigmaElements()
      .then(elements =>
        // transform data
        elements.map(transformElement)
      )
      // remove duplicate names
      .then(elements => removeDuplicates(elements))
      .then(async elements => {
        oCount = elements.length;
        const elementIds = elements.map(c => c.id);
        const chunkLen = 100;
        const chunks: string[] = [];

        for (let i = 0, j = elementIds.length; i < j; i += chunkLen) {
          chunks.push(elementIds.slice(i, i + chunkLen).join(','));
        }

        spinner.start(`Exporting icons from figma`);
        // get icons urls
        return Promise.all(chunks.map(chunk => getFigmaImagesUrls(chunk)))
          .then(iconsChunk => {
            spinner.succeed(`Successfully exported icons from figma`);
            const icons = iconsChunk.reduce((res, val) => ({ ...res, ...val }), {});

            spinner.start('Downloading SVG files from aws');
            // download icons
            return Promise.all(
              Object.values(elements).map(element =>
                // request the svg data from aws
                downloadSVG(icons[element.id], () => {
                  spinner.text = `${progress(dCount, oCount)} Downloading ${element.name} icon`;
                }).then(svg => {
                  dCount++;
                  // optimize svg
                  return svgo
                    .optimize(svg)
                    .then(optimized =>
                      fs.ensureDir(outputDir).then(() =>
                        // write svg file
                        fs.writeFileSync(
                          path.resolve(outputDir, `${element.name}.svg`),
                          transformSvgContent(optimized.data, element.name),
                          'utf8'
                        )
                      )
                    )
                    .catch(err => {
                      console.error('Something went wrong optimizing the svg data!', err);
                      process.exit(1);
                    });
                })
              )
            );
          })
          .then(() => {
            spinner.stopAndPersist({
              text: `${progress(
                dCount,
                oCount
              )} ${dCount} icons downloaded \nAll done! Icons successfully imported.`,
              symbol: '🎉',
            });
          });
      })
  )
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
