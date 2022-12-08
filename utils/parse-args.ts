/**
 * Parse argument value from process arguments
 * @param argv - process argv
 * @param name - argument name
 */
function parseArgs(argv: string[], name: string): string | null {
  const argKeyIndex = argv.findIndex(argKey => argKey === `--${name}`);

  if (argKeyIndex < 0 || !argv[argKeyIndex + 1]) {
    return null;
  }

  return argv[argKeyIndex + 1];
}

export = parseArgs;
