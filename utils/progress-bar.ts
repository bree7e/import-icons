/**
 * Draw progress bar
 * @param current - current progress
 * @param total - max progress
 */
const progress = (current: number, total: number) => {
  // tslint:disable-next-line: no-magic-numbers
  const percentage = Math.ceil((current * 10) / total);
  const bar = [
    '[',
    ' ',
    ' ',
    ' ',
    ' ',
    ' ',
    ' ',
    ' ',
    ' ',
    ' ',
    ' ',
    ']',
    // tslint:disable-next-line: no-magic-numbers
    ` ${Math.ceil((current * 100) / total)}%`,
  ];
  for (let i = 1; i <= percentage; i++) {
    bar[i] = '=';
  }
  return bar.join('');
};

export = progress;
