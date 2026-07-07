# Plan: Global Config settings UI (configurator)

Turn the empty [GlobalConfig.tsx](src/configurator/components/GlobalConfig/GlobalConfig.tsx) stub into a Fluent v9 **Drawer** (toggled by `showGlobalConfig`, gated to global-mode + site-collection admin) that shows the 4 settings as **editable** fields plus a small read-only diagnostics block, and a **Save** that writes changed settings to the `SPFxExtensionsConfiguration` SP list via PnP. Core's existing config watcher then propagates changes to the running apps. The configurator stays PnP-native; the only core change is enriching the settings defaults with a per-setting **control type** (so the form renders the right control automatically) — plus reusing the already-exported `getRuntimeCacheItem`.

## Phase 1 — Settings metadata (core)

[defaultConfig.ts](src/core/utility/defaultConfig.ts)

1. Add a `SettingControlType` (`"boolean" | "text" | "url"`) and a `SettingDescriptors` map keyed by setting Title, each entry `{ type, label, description?, default }`. Type it `Record<keyof typeof ConfigurationNames, SettingDescriptor>` so the compiler forces exactly one descriptor per setting. Refactor `getDefaultSettings(rootUrl)` to derive its `{Title, Data}` array from this map (RootCDNLocation's default = `rootUrl`). Single source of truth for both the default value and how each setting is rendered.

## Phase 2 — Settings service (PnP)

_New file_ [globalConfigService.ts](src/configurator/services/globalConfigService.ts)

2. `getGlobalSettingsItems()` — read `CONFIGURATION_LIST_NAME` items (`Id, Title, Data`) via `configurationWebSP`.
3. `getEffectiveSettings()` — merge items over `getDefaultSettings(configurationWebUrl.href)` → all keys with `{Title, Data, Id?}` (Id carried for updates).
4. `upsertSetting(title, data, id?)` — `items.getById(id).update({Data})` if it exists, else `items.add({Title, Data})` (creates a previously-defaulted key).

## Phase 3 — GlobalConfig Drawer UI

Rewrite [GlobalConfig.tsx](src/configurator/components/GlobalConfig/GlobalConfig.tsx)

5. `Drawer` (position `end`, size `large`) bound to `showGlobalConfig`; header with close, `Spinner` while loading.
6. **Settings form** (editable, data-driven): map over `SettingDescriptors` + effective values → for each render a `Field` (with `label`/`description`) containing a `Switch` when `type === "boolean"` (map `"true"`/`"false"` ↔ boolean) or an `Input` when `type === "text" | "url"`. Local signals + modified tracking (`useSignalEffect`, like [SelectedAppConfig.tsx](src/configurator/components/SelectedAppConfig/SelectedAppConfig.tsx)). No per-setting hardcoding — new settings render automatically.
7. **Diagnostics** (read-only): `AppCatalogUrl`, `SPFxDataSite` (url/compact) via `getRuntimeCacheItem`; `APP_VERSION`, `BUILD_DATE`.
8. Footer: **Save** (upsert only changed → re-read → toast) + **Close**; Save disabled unless modified; errors → toast.

## Phase 4 — Mount + gating

[index.tsx](src/configurator/components/index.tsx)

9. Render `<GlobalConfig />`; tighten the Settings button gate from `isSiteCollectionAdmin` to `configurationIsGlobal && isSiteCollectionAdmin`.

## Relevant files

- [defaultConfig.ts](src/core/utility/defaultConfig.ts) — add `SettingControlType` + `SettingDescriptors`; `getDefaultSettings` derives from them
- _new_ [globalConfigService.ts](src/configurator/services/globalConfigService.ts) — PnP read/merge/upsert against the config list
- [GlobalConfig.tsx](src/configurator/components/GlobalConfig/GlobalConfig.tsx) — the Drawer UI (descriptor-driven form)
- [index.tsx](src/configurator/components/index.tsx) — mount + gate
- reuse: [runtimeStore.ts](src/configurator/runtimeStore.ts) (`configurationWebSP`, `configurationWebUrl`, `showGlobalConfig`, `isSiteCollectionAdmin`, `configurationIsGlobal`), core `getRuntimeCacheItem`, `CONFIGURATION_LIST_NAME`, [Stack.tsx](src/configurator/components/common/Stack.tsx), [ToastNotification.tsx](src/configurator/components/common/ToastNotification.tsx)

## Verification

1. `get_errors` / `tsc` on changed files.
2. `bun run test` (confirm `app.test` / `runtimeStore.test` stay green with the index gate change).
3. Manual: global-mode admin → **Settings** → drawer loads values → edit `RootCDNLocation` + toggle a boolean → **Save** → confirm the SP list item is updated/created → core picks it up via the watcher (`configChange`) or on reload.

## Decisions

- Global mode + admin only; `configurationWebSP` already targets the app-catalog data site where the list lives.
- Edits write to the **SP list** (source of truth); core's watcher propagates — no direct IDB writes from the configurator.
- Settings form is **descriptor-driven**: each setting declares its control type (`boolean`/`text`/`url`) + label in `SettingDescriptors`, so the UI renders the right control with no per-field code.
- Runtime values are read-only; reuse the already-exported `getRuntimeCacheItem`. DB name is **not** shown (not worth exporting `DBNAME`); `isFreshCoreDB` also dropped.
- Out of scope: web-mode editing, editing runtime-cache values, whitelist-list UI, new SP fields.

## Context / architecture facts

- The configurator is a separate Preact + Fluent UI v9 + `@preact/signals` bundle, **PnP-native and decoupled** — it does not import core config/IDB services today (only `contextService`, `loggingService`, types).
- [runtimeStore.ts](src/configurator/runtimeStore.ts) exposes `configurationWebSP` (PnP `SPFI`), `configurationWebUrl` (`URL`), `configurationIsGlobal` (`!queryWeb`), `isSiteCollectionAdmin` (signal), `showGlobalConfig` (signal). In global mode `configurationWebSP` targets the app-catalog data site (where the config list lives), because the configurator page is served from there.
- PnP write pattern: `sp.web.lists.getByTitle(NAME).items.getById(id).update({Data})` / `.items.add({Title, Data})`; digest handled automatically by PnP. The list has `Title` (unique) + `Data` (single-line text).
- Settings (SP list `SPFxExtensionsConfiguration`): `RootCDNLocation` (url), `InterceptHistory` / `EnableAppWhiteList` / `UsePublicCDNForManifests` (`"true"`/`"false"`).
- Runtime cache (IDB `SPFxRuntimeCache`): `AppCatalogUrl` (string), `SPFxDataSite` (web object).
- `getDefaultSettings(rootUrl)` + the new `SettingDescriptors` are pure imports from [defaultConfig.ts](src/core/utility/defaultConfig.ts) (no side effects, safe to import into the configurator).
- Core config watcher (`configWatcherService`, 5-min poll + change token) auto-propagates SP-list edits to running apps via the `configChange` event.
- [app.tsx](src/configurator/app.tsx) wraps `<Index/>` in `FluentProvider` (Drawer portals work); toasts via `useToastController(toasterId)` from [ToastNotification.tsx](src/configurator/components/common/ToastNotification.tsx) (already rendered in `index.tsx`).

## Further considerations

1. **Propagation latency** — running apps reflect edits on the next watcher tick (≤5 min) or on reload; the success toast should say so. Recommend relying on the watcher (no extra push). Option: add a "reload to apply now" hint.
2. **List-missing edge** — core normally creates the list during init; if a read/add fails, surface a toast error. Recommend: assume-exists + graceful error.
3. **`RootCDNLocation` validation** — light non-empty check, optionally via `urlService.validateUrl`. Recommend: minimal for MVP.
