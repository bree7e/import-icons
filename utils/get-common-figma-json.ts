/**
 * Return content for create figma.json file
 */
function getCommonFigmaJson(): {
  $schema: string;
  projects: {};
} {
  return {
    $schema: './node_modules/@vepp/import-icons/schema/figma-schema.json',
    projects: {},
  };
}

export = getCommonFigmaJson;
