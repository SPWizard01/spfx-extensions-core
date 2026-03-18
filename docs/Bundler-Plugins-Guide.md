# SPFx Extensions: Bundler Plugins Guide

This document provides a comprehensive overview of the bundler plugins available in the SPFx Extensions framework, along with examples of how to use them with different bundler systems.

## Table of Contents

1. [Introduction](#introduction)
2. [Available Plugins](#available-plugins)
3. [Manifest Plugin](#manifest-plugin)
   - [Purpose](#purpose)
   - [Configuration Options](#configuration-options)
4. [Using with esbuild](#using-with-esbuild)
5. [Using with Webpack](#using-with-webpack)
6. [Using with Bun](#using-with-bun)
7. [Advanced Usage Examples](#advanced-usage-examples)

## Introduction

The SPFx Extensions framework provides plugins for different bundler systems to help automate the process of creating manifest files and configuring your application for SharePoint. These plugins integrate with popular JavaScript bundlers (esbuild, webpack, and Bun) to automatically generate the required manifest files for your SPFx Extensions applications.

## Available Plugins

The framework includes plugins for three major bundling systems:

1. **esbuild** - Fast JavaScript bundler with a simple API
2. **Webpack** - Comprehensive bundling solution with extensive ecosystem
3. **Bun** - Modern JavaScript runtime and bundler with high performance

Each plugin implementation provides similar functionality but is adapted to the specific bundler's architecture and plugin system.

## Manifest Plugin

### Purpose

The main purpose of the manifest plugin is to automatically generate a `manifest.txt` file that contains the necessary configuration for your SPFx Extension applications. This manifest includes:

- Entry point URLs for your applications
- Application definition mapping
- ESM module configuration
- Optional caching settings

### Configuration Options

All manifest plugins accept similar configuration options:

| Option | Type | Description |
|--------|------|-------------|
| `isESM` | `boolean` | Required. Indicates whether the application uses ESM modules |
| `includeAllOutputJs` | `boolean` | Optional. When `true`, automatically includes all output JS files as entry points |
| `appRelativeEntryPointUrls` | `string[]` | Optional. Array of relative paths to entry point files |
| `appDefinitionMap` | `Array` | Optional. Application configuration mapping |
| `enableCaching` | `boolean` | Optional. Whether to enable caching for the application |
| `generateCacheString` | `boolean` | Optional. Auto-generates a cache string for cache invalidation |
| `cacheString` | `string` | Optional. Custom cache string value |
| `outdir` | `string` | Optional for esbuild/webpack, required for Bun. Output directory for the manifest |

## Using with esbuild

The esbuild plugin (`manifestPlugin`) can be used in your esbuild configuration as follows:

```typescript
import { build } from "esbuild";
import { manifestPlugin } from "@spfx-extensions/core/plugins/esbuild";

await build({
  entryPoints: ["./src/app.ts"],
  outdir: "./dist",
  bundle: true,
  format: "esm",
  plugins: [
    manifestPlugin({
      isESM: true, // Required: specifies this is an ESM module
      includeAllOutputJs: true, // Automatically includes all JS outputs as entry points
      generateCacheString: true, // Generates a cache string for cache invalidation
      appDefinitionMap: [
        {
          appId: "my-app-id",
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

## Using with Webpack

The webpack plugin is a class implementation that can be included in your webpack configuration:

```typescript
const path = require("path");
const { SPFxExtensionManifestWriterPluginWebpack } = require("@spfx-extensions/core/plugins/webpack");

module.exports = {
  entry: "./src/app.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  plugins: [
    new SPFxExtensionManifestWriterPluginWebpack({
      isESM: true,
      includeAllOutputJs: true,
      outdir: path.resolve(__dirname, "dist"),
      appDefinitionMap: [
        {
          appId: "my-webpack-app",
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
};
```

## Using with Bun

For Bun, the plugin is a function that needs to be called after the build process:

```typescript
import { build, BuildOutput } from "bun";
import { bunManifestWriter } from "@spfx-extensions/core/plugins/bun";

const result: BuildOutput = await build({
  entrypoints: ["./src/app.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm"
});

// Generate the manifest after build
await bunManifestWriter({
  isESM: true,
  outdir: "./dist", // Required for Bun
  includeAllOutputJs: true,
  appDefinitionMap: [
    {
      appId: "my-bun-app",
      config: {
        enabledEverywhere: true,
        includedIds: [],
        includedHubIds: [],
        excludedIds: [],
        excludedHubIds: []
      }
    }
  ]
}, result);
```

## Advanced Usage Examples

### Manual Entry Points Configuration

If you want to manually specify the entry points rather than automatically including all JavaScript files:

```typescript
// esbuild example
manifestPlugin({
  isESM: true,
  includeAllOutputJs: false, // Don't include all JS files automatically
  appRelativeEntryPointUrls: [
    "./my-main-app.js",
    "./another-feature.js"
  ],
  appDefinitionMap: [
    {
      appId: "my-main-app",
      config: {
        enabledEverywhere: true,
        includedIds: [],
        includedHubIds: [],
        excludedIds: [],
        excludedHubIds: []
      }
    },
    {
      appId: "another-feature",
      config: {
        enabledEverywhere: false,
        includedIds: ["specific-web-id"],
        includedHubIds: [],
        excludedIds: [],
        excludedHubIds: []
      }
    }
  ]
})
```

### Enabling Caching with Hash Generation

To enable caching and automatically generate a cache invalidation string:

```typescript
// webpack example
new SPFxExtensionManifestWriterPluginWebpack({
  isESM: true,
  includeAllOutputJs: true,
  enableCaching: true, // Enable caching
  generateCacheString: true, // Generate a unique hash for cache invalidation
  appDefinitionMap: [
    // App configuration
  ]
})
```

### Non-ESM Application Configuration

For non-ESM applications:

```typescript
// esbuild example for non-ESM application
manifestPlugin({
  isESM: false, // This is a non-ESM application
  includeAllOutputJs: true,
  appDefinitionMap: [
    {
      appId: "legacy-app",
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
```

### Hot Module Replacement Integration

When using with hot module replacement (HMR):

```typescript
// esbuild example with HMR
import { context } from "esbuild";
import { esbuildHMRPlugin } from "esbuild-hot-reload";
import { manifestPlugin } from "@spfx-extensions/core/plugins/esbuild";

const ctx = await context({
  entryPoints: ["./src/app.ts"],
  outdir: "./dist",
  bundle: true,
  format: "esm",
  plugins: [
    esbuildHMRPlugin(33355), // HMR plugin
    manifestPlugin({
      isESM: true,
      includeAllOutputJs: true,
      generateCacheString: true
    })
  ]
});

await ctx.watch();
```

## Conclusion

The bundler plugins provided by the SPFx Extensions framework make it easier to integrate your application with SharePoint by automatically generating the required manifest files. By choosing the appropriate plugin for your bundler system, you can streamline your development workflow and ensure that your applications are properly configured for the SharePoint environment.
