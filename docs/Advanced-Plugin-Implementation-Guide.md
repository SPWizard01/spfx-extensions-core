# SPFx Extensions: Advanced Plugin Implementation Guide

This document provides a detailed exploration of the internal implementation of bundler plugins in the SPFx Extensions framework. It complements the `Bundler-Plugins-Guide.md` file by offering deeper technical insights for developers who want to understand the plugin architecture or create custom plugins.

## Table of Contents

1. [Introduction](#introduction)
2. [Manifest Format Deep Dive](#manifest-format-deep-dive)
3. [Plugin Implementation Architecture](#plugin-implementation-architecture)
   - [esbuild Plugin Architecture](#esbuild-plugin-architecture)
   - [Webpack Plugin Architecture](#webpack-plugin-architecture)
   - [Bun Plugin Architecture](#bun-plugin-architecture)
4. [Manifest Generation Process](#manifest-generation-process)
5. [Caching Mechanisms](#caching-mechanisms)
6. [Advanced Integration Examples](#advanced-integration-examples)
7. [Custom Plugin Development](#custom-plugin-development)

## Introduction

The SPFx Extensions framework includes plugins for esbuild, Webpack, and Bun that generate a `manifest.txt` file necessary for the framework to function. While the basic usage is covered in `Bundler-Plugins-Guide.md`, this document delves into the implementation details to provide a deeper understanding of how these plugins work internally.

## Manifest Format Deep Dive

The `manifest.txt` file is the cornerstone of the SPFx Extensions framework, containing critical information required for application registration and execution. This section explores the structure of this file in detail.

### SPFxExtensionFolderManifest Interface

The manifest is defined by the `SPFxExtensionFolderManifest` interface:

```typescript
export interface SPFxExtensionFolderManifest {
    /**
     * Relative path from manifest to the app entry point i.e. `./app.js` or `./somefolder/app.js?v=hash`
     */
    appRelativeEntryPointUrls: string[];
    appDefinitionMap: SPFxExtensionAppDefinitionMapItem[];
    /**
     * If set to false, the app will not be loaded as ESM module.
     * 
     * This means that app owner is responsible for loading the app by calling `window.__SPFxExtensions.RegisterApp` and/or `window.__SPFxExtensions.InstantiateApp` methods.
     * 
     * If set to true, the app will be loaded as ESM module and the app owner is responsible for providing a default export in the entry point as `SPFxExtensionAppRegistration[]`.
     */
    isESM: boolean;
    cacheString?: string;
    enableCaching?: boolean;
}
```

This interface includes:

- **appRelativeEntryPointUrls**: Array of relative paths to JavaScript entry point files
- **appDefinitionMap**: Configuration for each application
- **isESM**: Flag indicating whether the app uses ESM modules
- **cacheString**: Optional cache invalidation string
- **enableCaching**: Optional flag to enable caching

### App Definition Map

The app definition map is defined by the `SPFxExtensionAppDefinitionMapItem` interface:

```typescript
export interface SPFxExtensionAppDefinitionMapItem {
    /**
     * Id of app definition item or entrypoint url for NON-ESM.
     */
    appId: string;
    /**
     * Configuration of said app definition item.
     */
    config: SPFxExtensionAppMapItemConfig;
}
```

And the configuration is defined by:

```typescript
export interface SPFxExtensionAppMapItemConfig {
    /**
     * If enabled `excludedIds` and `excludedHubIds` will be scanned for exclusion.
     * 
     * Else `includedIds` and `includedHubIds` will be scanned for inclusion.
     */
    enabledEverywhere: boolean;
    /**
     * WebId or SiteId of the sp site where the app should be enabled;
     */
    includedIds: string[];
    /**
     * HubId (which is site collection id) of the sp site where the app should be enabled.
     */
    includedHubIds: string[];
    /**
     * WebId or SiteId of the sp site where the app should be disabled;
     */
    excludedIds: string[];
    /**
     * HubId (which is site collection id) of the sp site where the app should be disabled.
     */
    excludedHubIds: string[];
}
```

### Loading Process

When the framework loads, it:

1. Fetches the `manifest.txt` file
2. Validates the manifest structure
3. For each entry point in `appRelativeEntryPointUrls`:
   - If `isESM` is true, dynamically imports the entry point as an ESM module
   - If `isESM` is false, loads the entry point as a traditional script
4. Each entry point should export app registrations that are then processed by the framework

## Plugin Implementation Architecture

### esbuild Plugin Architecture

The esbuild plugin (`manifestPlugin`) is implemented as a function that returns an esbuild plugin object:

```typescript
export function manifestPlugin(options: SPFxESBuildManifestPluginOptions): Plugin {
    return {
        name: 'esbuild-spfxmanifest-plugin',
        setup(build: PluginBuild) {
            build.onEnd(async (buildResult) => {
                // Manifest generation logic
            });
        }
    }
}
```

Key components of the implementation:

1. **Plugin Setup**: The plugin hooks into esbuild's `onEnd` lifecycle hook
2. **Metafile Processing**: Uses esbuild's metafile to discover output files
3. **Path Normalization**: Converts absolute paths to relative paths for SharePoint compatibility
4. **Cache String Generation**: Optionally creates a unique hash for cache invalidation
5. **File Writing**: Writes the manifest to the output directory

### Webpack Plugin Architecture

The webpack plugin (`SPFxExtensionManifestWriterPluginWebpack`) is implemented as a class that implements the `WebpackPluginInstance` interface:

```typescript
export class SPFxExtensionManifestWriterPluginWebpack implements WebpackPluginInstance {
    constructor(private options: SPFxWebpackManifestPluginOptions) {
        // Validation logic
    }
    
    writeManifestFile(outputManifest: string, manifestToWrite: SPFxExtensionFolderManifest) {
        // File writing logic
    }

    apply(compiler: Compiler) {
        compiler.hooks.done.tap(
            'SPFxExtensions Manifest Writer Plugin',
            (stats) => {
                // Manifest generation logic
            }
        );
    }
}
```

Key components of the implementation:

1. **Plugin Registration**: The plugin hooks into webpack's `done` hook
2. **Asset Collection**: Collects output assets from the webpack compilation
3. **JS File Filtering**: Filters for JavaScript files to include in the manifest
4. **Cache String Generation**: Similar to esbuild, creates a hash for cache invalidation
5. **Synchronous File Writing**: Uses `fs.writeFileSync` to write the manifest

### Bun Plugin Architecture

Unlike the other plugins, the Bun implementation (`bunManifestWriter`) is not a plugin in the traditional sense but a function that's called after the build completes:

```typescript
export async function bunManifestWriter(options: SPFxBunBuildManifestPluginOptions, buildOutput: BuildOutput) {
    // Validation and setup
    
    // Manifest generation logic
    
    // File writing
}
```

Key components of the implementation:

1. **Post-Build Processing**: Runs after the Bun build completes
2. **Entry Point Extraction**: Extracts entry points from the build output
3. **Path URL Conversion**: Uses Bun's `pathToFileURL` for path normalization
4. **Bun-Specific Hashing**: Uses `Bun.CryptoHasher.hash` for cache string generation
5. **Asynchronous File Writing**: Uses `Bun.write` for file operations

## Manifest Generation Process

All plugins follow a similar process for generating the manifest:

1. **Option Validation**: Check required options and provide defaults
2. **Manifest Object Creation**: Create a basic manifest object from options
3. **Cache String Generation** (if enabled): Generate a unique hash
4. **Entry Point Collection**: Either use provided entry points or collect from the build output
5. **Path Normalization**: Normalize paths to be relative to the output directory
6. **File Writing**: Write the manifest to disk

### Entry Point Collection Strategies

The plugins use different strategies for collecting entry points:

1. **Manual Configuration**: Use `appRelativeEntryPointUrls` provided in options
2. **Automatic Discovery**: When `includeAllOutputJs` is true:
   - esbuild: Filter metafile outputs for `.js` files
   - webpack: Filter compilation assets for `.js` files
   - Bun: Filter build outputs for entry point type

### Path Normalization

For SharePoint compatibility, paths need to be normalized. The plugins handle this differently:

- **esbuild**: `outputJs = Object.keys(buildResult.metafile.outputs).filter(k => k.toLowerCase().endsWith(".js")).map((key) => key.replace(dist, "."))`
- **webpack**: Assets are already normalized by webpack
- **Bun**: `epUrl.href.replace(`${basePathUrl.href}/`, "")`

## Caching Mechanisms

All plugins support caching to improve performance in production environments. This is implemented through two main options:

- **enableCaching**: Boolean flag to enable/disable caching
- **generateCacheString**: Boolean flag to generate a unique cache string

When a cache string is generated, it uses different approaches per bundler:

- **esbuild**: `hash("sha1", `${Date.now()}`, "hex")`
- **webpack**: `hash("sha1", `${Date.now()}`, "hex")`
- **Bun**: `Bun.CryptoHasher.hash("sha1", `${Date.now()}`, "hex")`

The cache string is appended to URLs when the framework loads JavaScript files, ensuring that browsers fetch the latest version after updates.

## Advanced Integration Examples

### Custom Build Pipeline with esbuild

For more complex build pipelines, you might want to integrate the manifest plugin with other esbuild plugins:

```typescript
import { build, context } from "esbuild";
import { manifestPlugin } from "@spfx-extensions/core/plugins/esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

const isProd = process.env.NODE_ENV === "production";

await build({
  entryPoints: ["./src/app.ts", "./src/components/index.ts"],
  outdir: "./dist",
  bundle: true,
  minify: isProd,
  sourcemap: !isProd,
  format: "esm",
  splitting: true,
  metafile: true,
  plugins: [
    sassPlugin({
      type: "css",
      loadPaths: ["./src/styles"]
    }),
    manifestPlugin({
      isESM: true,
      includeAllOutputJs: true,
      enableCaching: isProd,
      generateCacheString: isProd,
      appDefinitionMap: [
        {
          appId: "my-application",
          config: {
            enabledEverywhere: true,
            includedIds: [],
            includedHubIds: [],
            excludedIds: [],
            excludedHubIds: []
          }
        }
      ]
    })
  ]
});
```

### Development Server with HMR

For a development setup with hot module replacement using esbuild:

```typescript
import { context } from "esbuild";
import { esbuildHMRPlugin } from "esbuild-hot-reload";
import { createServer, request, RequestOptions } from "https";
import { manifestPlugin } from "@spfx-extensions/core/plugins/esbuild";
import * as fs from "fs";

const cert = fs.readFileSync("./cert.pem");
const key = fs.readFileSync("./key.pem");

// Create context for incremental builds
const ctx = await context({
  entryPoints: ["./src/index.ts"],
  outdir: "./dist",
  bundle: true,
  format: "esm",
  splitting: true,
  metafile: true,
  plugins: [
    // HMR plugin
    esbuildHMRPlugin({ port: 3333 }),
    
    // Manifest plugin
    manifestPlugin({
      isESM: true,
      includeAllOutputJs: true,
      generateCacheString: true,
      appDefinitionMap: [
        {
          appId: "dev-app",
          config: {
            enabledEverywhere: true,
            includedIds: [],
            includedHubIds: [],
            excludedIds: [],
            excludedHubIds: []
          }
        }
      ]
    })
  ]
});

// Watch for changes
await ctx.watch();

// Start development server
const devServer = createServer({
  cert,
  key
}, async (req, res) => {
  // Server implementation
});

devServer.listen(3333, () => {
  console.log("Development server running on https://localhost:3333");
});
```

### Webpack Configuration with Multiple Entry Points

For a webpack setup with multiple entry points and optimization:

```javascript
const path = require("path");
const { SPFxExtensionManifestWriterPluginWebpack } = require("@spfx-extensions/core/plugins/webpack");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    main: "./src/main.ts",
    admin: "./src/admin.ts"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true
  },
  optimization: {
    minimizer: [new TerserPlugin()],
    splitChunks: {
      chunks: 'all',
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new SPFxExtensionManifestWriterPluginWebpack({
      isESM: true,
      includeAllOutputJs: true,
      enableCaching: true,
      generateCacheString: true,
      appDefinitionMap: [
        {
          appId: "main-app",
          config: {
            enabledEverywhere: true
          }
        },
        {
          appId: "admin-app",
          config: {
            enabledEverywhere: false,
            includedIds: ["admin-site-id"]
          }
        }
      ]
    })
  ]
};
```

## Custom Plugin Development

If you need to create a custom plugin or extend the existing ones, here's a guide to implementing your own manifest generator.

### Custom esbuild Plugin

```typescript
import { Plugin, PluginBuild } from "esbuild";
import { writeFile } from "fs/promises";
import { SPFxExtensionFolderManifest } from "@spfx-extensions/core/models/appFolderManifest";

export interface CustomManifestPluginOptions {
  isESM: boolean;
  // Add custom options here
}

export function customManifestPlugin(options: CustomManifestPluginOptions): Plugin {
  return {
    name: 'custom-spfxmanifest-plugin',
    setup(build: PluginBuild) {
      build.onEnd(async (buildResult) => {
        if (!buildResult.metafile) {
          console.error("No metafile found");
          return;
        }
        
        // Create manifest with custom logic
        const manifestToWrite: SPFxExtensionFolderManifest = {
          appRelativeEntryPointUrls: [],
          appDefinitionMap: [
            {
              appId: "custom-app",
              config: {
                enabledEverywhere: true,
                includedIds: [],
                includedHubIds: [],
                excludedIds: [],
                excludedHubIds: []
              }
            }
          ],
          isESM: options.isESM,
          enableCaching: false,
          cacheString: ""
        };
        
        // Custom entry point processing
        const outputDir = build.initialOptions.outdir ?? "";
        const outputJs = Object.keys(buildResult.metafile.outputs)
          .filter(k => k.toLowerCase().endsWith(".js"))
          .map(key => {
            // Custom path transformation
            return key.replace(outputDir, ".");
          });
        
        manifestToWrite.appRelativeEntryPointUrls = outputJs;
        
        // Write the manifest
        const manifestLocation = `${outputDir}/custom-manifest.txt`;
        await writeFile(manifestLocation, JSON.stringify(manifestToWrite));
      });
    }
  };
}
```

### Custom Webpack Plugin

```typescript
import { Compiler, WebpackPluginInstance } from "webpack";
import { writeFileSync } from "fs";
import { SPFxExtensionFolderManifest } from "@spfx-extensions/core/models/appFolderManifest";

export interface CustomWebpackManifestPluginOptions {
  isESM: boolean;
  // Add custom options here
}

export class CustomWebpackManifestPlugin implements WebpackPluginInstance {
  constructor(private options: CustomWebpackManifestPluginOptions) {}
  
  apply(compiler: Compiler) {
    compiler.hooks.done.tap(
      'Custom SPFx Manifest Plugin',
      (stats) => {
        const outputPath = stats.compilation.outputOptions.path ?? "";
        const outputManifest = `${outputPath}/custom-manifest.txt`;
        
        // Create manifest with custom logic
        const manifestToWrite: SPFxExtensionFolderManifest = {
          appRelativeEntryPointUrls: [],
          appDefinitionMap: [
            {
              appId: "custom-webpack-app",
              config: {
                enabledEverywhere: true,
                includedIds: [],
                includedHubIds: [],
                excludedIds: [],
                excludedHubIds: []
              }
            }
          ],
          isESM: this.options.isESM,
          enableCaching: false,
          cacheString: ""
        };
        
        // Custom entry point processing
        const assets: string[] = [];
        const keys = Array.from(stats.compilation.assetsInfo.keys());
        keys.forEach((key: string) => {
          assets.push(key.toLowerCase());
        });
        
        const jsRegex = /\.js\??/;
        const outputJs = assets.filter(k => jsRegex.test(k));
        manifestToWrite.appRelativeEntryPointUrls = outputJs;
        
        // Write the manifest
        writeFileSync(outputManifest, JSON.stringify(manifestToWrite));
      }
    );
  }
}
```

### Custom Bun Plugin

```typescript
import { BuildOutput } from "bun";
import { SPFxExtensionFolderManifest } from "@spfx-extensions/core/models/appFolderManifest";

export interface CustomBunManifestPluginOptions {
  isESM: boolean;
  outdir: string;
  // Add custom options here
}

export async function customBunManifestWriter(
  options: CustomBunManifestPluginOptions,
  buildOutput: BuildOutput
) {
  // Create manifest with custom logic
  const manifestToWrite: SPFxExtensionFolderManifest = {
    appRelativeEntryPointUrls: [],
    appDefinitionMap: [
      {
        appId: "custom-bun-app",
        config: {
          enabledEverywhere: true,
          includedIds: [],
          includedHubIds: [],
          excludedIds: [],
          excludedHubIds: []
        }
      }
    ],
    isESM: options.isESM,
    enableCaching: false,
    cacheString: ""
  };
  
  // Custom entry point processing
  const entryPoints = buildOutput.outputs.filter(o => o.kind === "entry-point");
  const epTable: string[] = [];
  
  for (const ep of entryPoints) {
    const basePathUrl = Bun.pathToFileURL(options.outdir);
    const epUrl = Bun.pathToFileURL(ep.path);
    const relativePath = epUrl.href.replace(`${basePathUrl.href}/`, "");
    epTable.push(relativePath);
  }
  
  manifestToWrite.appRelativeEntryPointUrls = epTable;
  
  // Write the manifest
  const outputManifest = `${options.outdir}/custom-manifest.txt`;
  await Bun.write(outputManifest, JSON.stringify(manifestToWrite));
}
```

### Plugin Integration Into the Framework

To integrate custom plugins with the SPFx Extensions framework, ensure they:

1. Generate a valid manifest following the `SPFxExtensionFolderManifest` interface
2. Write the manifest to a location the framework expects
3. Include all necessary entry points and app configurations

The default paths and naming conventions expected by the framework are:

- Location: Output directory of your bundler
- Filename: `manifest.txt`
- Format: JSON stringified object

By following these patterns, your custom plugins will integrate seamlessly with the framework.
