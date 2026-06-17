# SPFx Extensions Core – AI Working Notes

## Architecture Landmarks

- `src/core/__spfxCore.ts` bootstraps the runtime, registers the configurator app, and hands off to `src/core/services/initializationService.ts` which wires context, manifest watchers, and app loaders.
- Global state flows through `window.__SPFxExtensions` (see `src/core/__spfxLoader.ts`); loaders expect you to resolve `__CorePromise` and populate `Utils` before importing apps.
- The runtime splits responsibilities across services: context/digest/cache/app registration all live under `src/core/services/*`; look here first when touching lifecycle logic.
- `src/index.ts` re-exports the public API surface; anything added elsewhere must be exported here to ship in `dist`.

## Core Runtime Workflow

- `initCoreServices()` (services/initializationService) cleans caches, initializes configuration, reads context via `services/spContextService.ts`, and begins manifest polling via `services/manifestWatcherService.ts`.
- `componentLoaderService.ts` orders manifest imports root → site → web, dedupes scripts, and calls `window.__SPFxExtensions.RegisterApp`; manual entries must self-register via the global API.
- Context changes dispatch `contextChange` events; handlers rerun `loadModernApps` and unregister definitions that no longer match `appDefinitionMap` rules.
- Local debugging: set `localStorage.SPFXEXT = <port>` to force `__spfxLoader` to import from `https://localhost:<port>/__spfxCore.js` and the matching configurator bundle.

## Configurator UI

- `src/configurator/__spfxCoreConfigurator.ts` mounts `configurator/app.tsx`, which renders Fluent UI v9 components through Preact (`tsconfig` maps React imports to `preact/compat`).
- Runtime state lives in `configurator/runtimeStore.ts` using `@preact/signals`; it eagerly fetches site/web/app data via PnP helpers in `configurator/services/*`.
- The configurator theme derives from `window.__globalSettings__`; tests provide a stub in `__tests__/vitest.setup.ts`—mirror that shape if you add new theme accessors.

## Bundler + Manifests

- `build.ts` runs Bun twice: once for core entrypoints (`entrypoints.ts`) and once for plugin packages (`src/plugins/{bun,esbuild,webpack}`), then emits declarations via `tsc -p tsconfig.json`.
- `serve.ts` wraps `bun-dev-server` with HTTPS (cert/key files at repo root) and calls `bunManifestWriter` post-build; requests hit port `33355` unless overridden.
- Manifest writers live in `src/plugins/*/manifestPlugin.*`; they all emit `manifest.json` matching `models/appFolderManifest.ts`. Follow `docs/Advanced-Plugin-Implementation-Guide.md` and `docs/Plugin-Integration-Lifecycle.md` for option semantics.

## Developer Workflows

- Install dependencies with Bun (the repo assumes `bun install`).
- `bun run serve` starts the HTTPS dev server, watches `src`, and rewrites manifests (trust `serve_cert.pem` / `serve_key.pem`).
- `bun run build` executes `build.ts --prod`, flips `DEBUG=false`, strips console calls, and emits both core + plugin bundles before running `tsc -p tsconfig.json`.
- `bun run esbuild` / `bun run esserve` provide lighter esbuild-only workflows when you do not need the Bun dev server wrapper.
- After editing loader or manifest logic, set `localStorage.SPFXEXT` to your dev port and reload a modern page or classic wrapper (`src/core/__spfxWrapperClassic.ts`) to verify integration.

## Testing

- `bun run test` executes `vitest run` with `happy-dom`; coverage lives under `__coverage__` via `bun run coverage`.
- `__tests__/vitest.setup.ts` seeds DOM globals, crypto, fake IndexedDB, and stubs `DEBUG`; keep this file in sync with any new global assumptions to avoid brittle tests.
- Tests live alongside features in `**/__tests__/**/*.test.ts`; prefer exercising exported services (e.g., `loadModernApps`, manifest helpers) rather than private utilities.

## Conventions & Tips

- TypeScript is strict ESM (`type: module`). Respect the Preact JSX config and avoid default React imports outside `preact/compat`.
- Globals/constants (e.g., `CONFIGURATOR_APP_ID`, manifest names) come from `src/utilities/constants.ts`; reuse them instead of hardcoding strings.
- Use `@preact/signals` for observable state in the configurator; avoid mixing React state APIs with signals.
- When adding app registrations, always export an array of `SPFxExtensionAppRegistration` objects and update the manifest `appDefinitionMap` to control targeting.
- Reference `docs/Application-Registration-Lifecycle-Guide.md` for lifecycle hooks and `docs/Lifecycle-Events-Reference.md` when you need to raise or listen for custom events.
