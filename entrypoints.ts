export const coreEntryPoints = [
  "./src/index.ts",
  "./src/configurator/spfx-extensions-coreconfigurator.ts",
  "./src/core/spfx-extensions-core.ts",
  "./src/core/spfx-extensions-loader.ts",
  "./src/core/spfx-extensions-classicwrapper.ts",
  "./src/core/spfx-extensions-classiccustomaction.ts",
];

export const pluginEntryPoints = [
  "./src/plugins/esbuild/index.ts",
  "./src/plugins/bun/index.ts",
  "./src/plugins/webpack/index.ts",
];
