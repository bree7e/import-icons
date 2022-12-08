/**
 * Transform element to object with name and id
 * @param c - element with id and name from figma
 */
const transformElement = (c: { id: string; name: string }) => ({
  name: c.name
    .trim()
    .toLowerCase()
    .replace(/[\/\\\s]/g, '_'),
  id: c.id,
});

export = transformElement;
