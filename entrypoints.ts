export const coreEntryPoints = [
    "./src/index.ts",
    "./src/configurator/__spfxCoreConfigurator.ts",
    "./src/core/__spfxCore.ts",
    "./src/core/__spfxLoader.ts",
    "./src/core/__spfxWrapperClassic.ts",
    // "./src/core/coreClassicWrapper.ts",
    // "./src/core/coreClassicCustomAction.ts",
]

export const pluginEntryPoints = [
    "./src/plugins/esbuild/index.ts",
    "./src/plugins/bun/index.ts",
    "./src/plugins/webpack/index.ts"
]