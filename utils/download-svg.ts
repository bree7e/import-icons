import got from 'got';

/**
 * Download svg by url
 * @param url - url
 * @param downloadProgress - download progress callback
 */
const downloadSVG = (url: string, downloadProgress: () => void): Promise<string> =>
  new Promise(async (resolve, reject) => {
    try {
      const response = await got
        .get(url, {
          headers: { 'Content-Type': 'images/svg+xml' },
        })
        .on('downloadProgress', downloadProgress);
      resolve(response.body);
    } catch (e) {
      reject(e);
    }
  });

export = downloadSVG;
