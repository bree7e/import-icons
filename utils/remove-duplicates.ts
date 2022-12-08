/**
 * Returns elements without duplicate names
 * @param elements - figma elements
 */
function removeDuplicates(
  elements: { name: string; id: string }[]
): { name: string; id: string }[] {
  const res: { name: string; id: string }[] = [];
  const duplicateNames = new Set<string>();

  for (const element of elements) {
    if (res.findIndex(({ name }) => name === element.name) < 0) {
      res.push(element);
    } else {
      duplicateNames.add(element.name);
    }
  }

  for (const name of duplicateNames) {
    console.warn(
      `[WARN] The element named ${name} is duplicated. Only one of them will be downloaded!`
    );
  }

  return res;
}
export = removeDuplicates;
