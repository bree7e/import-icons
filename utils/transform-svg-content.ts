/**
 * Handle svg content: move masks to "defs" tag, add icon name prefix for ids, add css variables
 * @param {*} svg - svg content
 */
export function transformSvgContent(svg: string, iconName: string) {
  let masks = [];
  while (svg.search(/(<mask.*?<\/mask>)/im) !== -1) {
    svg = svg.replace(/(<mask.*?<\/mask>)/im, (a) => {
      masks.push(a);
      return '';
    });
  }

  if (masks.length) {
    if (svg.search('<defs>') !== -1) {
      svg = svg.replace('<defs>', `<defs>${masks.join()}`);
    } else {
      svg = svg.replace(/(<svg.*?>)/im, (a) => {
        return `${a}<defs>${masks.join()}</defs>`;
      });
    }
  }

  svg = svg.replace(/id="(.*?)"/gim, (_, b) => {
    return `id="${iconName}_${b}"`;
  });
  
  svg = svg.replace(/="url\(#(.*?)\)"/gim, (_, b) => {
    return `="url(#${iconName}_${b})"`;
  });

  return svg;
};
