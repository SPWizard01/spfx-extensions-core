# Plan: Split config settings from runtime cache + centralize defaults merge

Today `SPFxExtensionConfig` (one IDB store) and `ConfigurationNames` (one enum) conflate **9 keys of 4 kinds**: 4 real settings, 1 bootstrap primitive (`AppCatalogUrl`), 3 ensure-caches (`SPFxDataSite`, `ConfiguratorPageData`, `AppWhiteList`), and 1 version marker. `MINIMAL_CONFIG_COUNT` (=9) only reaches 9 via side effects of 5 unrelated services, while `createDefaultListItems` seeds only 4 — so it's fragile and the cached vs fresh read paths return different shapes. The fix: **settings live in their own store and always resolve as `defaults ⊕ API` (API wins, defaults fill gaps)**; the bootstrap primitive + ensure-caches move to a new `SPFxRuntimeCache` store; the `Version` marker is **removed entirely** in favour of a **version-suffixed DB name** (IDB schema stays at v1); and `MINIMAL_CONFIG_COUNT` is deleted.

## Phase 1 — Types & pure defaults

Files: [defaultConfig.ts](src/core/utility/defaultConfig.ts), [configurationList.ts](src/models/configurationList.ts)

1. Shrink `ConfigurationNames` to settings only (`RootCDNLocation`, `InterceptHistory`, `EnableAppWhiteList`, `UsePublicCDNForManifests`). This narrows `ConfigurationListBaseData["Title"]` so the compiler flags every misplaced writer.
2. Add `RuntimeCacheNames` (`AppCatalogUrl`, `SPFxDataSite`, `ConfiguratorPageData`, `AppWhiteList`) + a `RuntimeCacheBaseData`/`RuntimeCacheData` type. **No `Version` key** — the version marker is dropped entirely (replaced by the version-suffixed DB name in Phase 2).
3. Replace the **mutating** `getCoreDefaultConfiguration()` with a pure `getDefaultSettings(rootCdnDefault)` returning a fresh, complete array every call (every setting has a default; `RootCDNLocation` injected from the caller). Fixes the shared-array mutation bug and drops the odd `Version: BUILD_DATE` enum value.

## Phase 2 — IDB store split

Files: [coreIdbService.ts](src/core/services/coreIdbService.ts) + build-time globals in [build.ts](build.ts), [serve.ts](serve.ts), [vitest.config.ts](vitest.config.ts), [globals.d.ts](src/@types/globals.d.ts) _(depends on Phase 1)_

4. **Version-suffix the DB name; keep the schema at v1 (no bump, no migration).**
   - Set `DBNAME = ${DEBUG_KEY_APP_PREFIX}COREDB_${APP_VERSION}` and keep `openDB(DBNAME, 1, …)`. `APP_VERSION` = the `package.json` version injected as a build-time global (mirror the existing `BUILD_DATE` `define` in [build.ts](build.ts) / [serve.ts](serve.ts) / [vitest.config.ts](vitest.config.ts) and declare it in [globals.d.ts](src/@types/globals.d.ts)). The name is **stable during development** — it only rolls to a fresh DB when the version is bumped (manual, intentional). A new release ⇒ new DB name ⇒ the existing `oldVersion === 0` upgrade branch creates **all** stores fresh.
   - Add `SPFxRuntimeCache` to the schema / `StoreNames` and create it inside that same `oldVersion === 0` branch. Add `getRuntimeCacheItem` / `addOrUpdateRuntimeCache` (with eviction) mirroring the config helpers; retype the settings helpers to the settings union.
   - Expose an `isFreshCoreDB` flag (set `true` when `upgrade` runs with `oldVersion === 0`) for Phase 3's cache-bust trigger.

## Phase 3 — Move the 4 non-settings + drop the version marker

_(depends on Phase 2; files parallel)_

5. [appCatalogService.ts](src/core/services/appCatalogService.ts) `AppCatalogUrl`, [configurationWebService.ts](src/core/services/configurationWebService.ts) `SPFxDataSite`, [pageService.ts](src/core/services/pageService.ts) `ConfiguratorPageData`, [whiteListService.ts](src/core/services/whiteListService.ts) `AppWhiteList` → switch their get/put to the runtime helpers.
6. [browserCache.ts](src/core/services/browserCache.ts): rewrite `cleanCacheOnUpgrade` to **drop the `Version` marker and the `getCoreConfig()` call entirely**. Trigger the `window.caches` (HTTP asset) bust off `isFreshCoreDB` — a fresh version-suffixed DB _is_ the “new deployment” signal, so the once-per-version bust is preserved with no stored marker and no heavy config init. (`cleanStorageCache(…, true)` still only reloads when it actually deletes something, so first-time users don't reload.)

## Phase 4 — Centralize merge + delete the count

File: [configurationListService.ts](src/core/services/configurationListService.ts) _(depends on 1–3)_

7. Add `mergeSettings(items)` = `getDefaultSettings(SPFX_EXTENSIONS_SITE_URL)` overlaid by `items`.
8. Rewrite `getConfigurationListDataCached` to gate on **settings-store emptiness** (not a magic count): empty → hold `CONFIG_BOOTSTRAP_LOCK`, `ensureConfigurationList()`, seed only if it's a new list, read API, cache; then return `mergeSettings`. Non-empty → `mergeSettings(cache)`.
9. `getConfigurationListData` (fresh) returns `mergeSettings(api)`; `commitConfigItems` writes raw to IDB but sets the memo to `mergeSettings(raw)`. `createDefaultListItems` uses `getDefaultSettings` (one-time, admin-gated seed). Delete `MINIMAL_CONFIG_COUNT`.

## Phase 5 — Reader cleanup

File: [coreConfigService.ts](src/core/services/coreConfigService.ts) _(depends on Phase 4)_

10. `getBooleanCoreConfig`: drop the IDB self-heal write (merge guarantees presence). `getRootCDNLocation`: simplify the `?? fallback` since the value is always present.
11. Verify [configWatcherService.ts](src/core/services/configWatcherService.ts) needs no change (change-token hashing stays on raw API items; merge happens via `commitConfigItems`).

## Relevant files

- [configurationListService.ts](src/core/services/configurationListService.ts) — `mergeSettings`, gate rewrite, remove `MINIMAL_CONFIG_COUNT`, `commitConfigItems` merged memo, `createDefaultListItems`
- [defaultConfig.ts](src/core/utility/defaultConfig.ts) — split enums, pure `getDefaultSettings`
- [coreIdbService.ts](src/core/services/coreIdbService.ts) — new store + helpers + version-suffixed DB name (schema v1) + `isFreshCoreDB` flag
- [build.ts](build.ts) / [serve.ts](serve.ts) / [vitest.config.ts](vitest.config.ts) / [globals.d.ts](src/@types/globals.d.ts) — inject the `APP_VERSION` build-time global
- [appCatalogService.ts](src/core/services/appCatalogService.ts) / [configurationWebService.ts](src/core/services/configurationWebService.ts) / [pageService.ts](src/core/services/pageService.ts) / [whiteListService.ts](src/core/services/whiteListService.ts) / [browserCache.ts](src/core/services/browserCache.ts) — move keys to runtime store
- [coreConfigService.ts](src/core/services/coreConfigService.ts) — reader simplification

## Verification

1. `bunx tsc -p tsconfig.json` (or the errors tool) — the narrowed `ConfigurationNames` should surface every writer that must move; zero errors when done.
2. `bun run test` — full suite green.
3. Optional new pure unit test: `getDefaultSettings` returns a fresh array (no cross-call mutation) and `mergeSettings` gives API precedence + fills missing keys with defaults (no IDB needed).
4. Manual: cold load on an uninitialized tenant (list/page/whitelist created + seeded), warm reload (served from cache), edit a setting in the SP list (watcher propagates via `configChange`), and confirm a _newly added_ setting key resolves to its default without a list entry.
5. Manual: bump the `package.json` version, rebuild, reload — confirm a fresh `…_<newVersion>` DB is created and stale `window.caches` entries are busted (page reloads once).

## Decisions

- New `SPFxRuntimeCache` store for non-settings. **DB schema stays version 1**; the DB name is **suffixed with the package version** (`SPFXEXT_COREDB_${APP_VERSION}`) so each release gets a fresh DB — no upgrade branches, no migrations. The `Version` marker is removed; the `window.caches` bust is triggered by a fresh versioned DB (`isFreshCoreDB`).
- In-memory `defaults ⊕ API` merge for **all** users; seed writes stay **admin-gated** (only on new-list creation) — regular users get working defaults without 403s.
- Keep both `AppCatalogUrl` (discovered bootstrap primitive, control plane) and `RootCDNLocation` (overridable setting, data plane); they only share a default.
- Out of scope: whitelist data model, configurator UI, cleanup of orphaned old-version DBs (see Further considerations).

## Context: AppCatalogUrl vs RootCDNLocation

They look redundant because they **default to the same folder**, but answer two different questions:

- **`AppCatalogUrl` → control plane (where settings live).** Discovered from tenant settings (`SP_TenantSettings_Current.CorporateCatalogUrl`); builds `SPFX_EXTENSIONS_SITE_URL = {AppCatalogUrl}/SPFxExtensionsData`, used everywhere for infrastructure (config list, whitelist list, configurator page, request digests). The app catalog is a single tenant-level site — discovered infrastructure, not a knob.
- **`RootCDNLocation` → data plane (where apps are served from).** A real setting consumed only by `getRootCDNLocation()` → `{RootCDNLocation}/SPFxExtensions/`, the folder scanned for the root `collectionconfig.json` / manifests ([txtAppsService.ts](src/core/services/txtAppsService.ts#L92), [manifestWatcherService.ts](src/core/services/manifestWatcherService.ts#L32)). Overridable so app bundles can live on a different site/library/CDN (pairs with `UsePublicCDNForManifests`).

Example: config/whitelist always live in `/sites/appcatalog/SPFxExtensionsData` (from `AppCatalogUrl`), but an admin could set `RootCDNLocation` to `https://cdn.contoso.com/spfx-apps` so JS bundles are served from a CDN. Default: both point at the same `SPFxExtensionsData` site, hence the apparent overlap.

## Current key inventory (SPFxExtensionConfig store, keyed by Title)

| Key                        | Writer                                | Nature              | Target store                                       |
| -------------------------- | ------------------------------------- | ------------------- | -------------------------------------------------- |
| `RootCDNLocation`          | list seed                             | SETTING             | SPFxExtensionConfig                                |
| `InterceptHistory`         | list seed                             | SETTING             | SPFxExtensionConfig                                |
| `EnableAppWhiteList`       | list seed / `getBooleanCoreConfig`    | SETTING             | SPFxExtensionConfig                                |
| `UsePublicCDNForManifests` | list seed / `getBooleanCoreConfig`    | SETTING             | SPFxExtensionConfig                                |
| `AppCatalogUrl`            | `appCatalogService` (tenant API)      | BOOTSTRAP primitive | SPFxRuntimeCache                                   |
| `SPFxDataSite`             | `configurationWebService` (web API)   | ENSURE-CACHE        | SPFxRuntimeCache                                   |
| `ConfiguratorPageData`     | `pageService` (pages API)             | ENSURE-CACHE        | SPFxRuntimeCache                                   |
| `AppWhiteList`             | `whiteListService` (list ensure resp) | ENSURE-CACHE        | SPFxRuntimeCache                                   |
| `Version`                  | `browserCache` (BUILD_DATE)           | INTERNAL marker     | **removed** (replaced by version-suffixed DB name) |

## Further considerations

1. **Cold-cache re-bootstrap:** with the emptiness gate, if the SP list ever returns 0 items the store stays empty and re-bootstraps each memo cycle. Seeding guarantees ≥4 on new lists so it's a non-issue in practice — but a lightweight `Bootstrapped` marker in the runtime store could be added as belt-and-suspenders. Recommend: **skip the marker** unless desired.
2. **`ensureConfigurationList()` on cold reads:** still runs one cheap 404-check GET on every cold read (rare, since the 5-min watcher keeps the cache warm). Recommend: **leave as-is**; optionally gate behind a runtime-store "ensured" marker later.
3. **`cleanCacheOnUpgrade()` decoupling:** it is the first call in `initCoreServices()` and currently triggers full config init (web/whitelist/page ensure) just to read `Version`. The new `isFreshCoreDB` trigger removes both the stored marker and the `getCoreConfig()` call — verify no ordering relies on that incidental init (config init is promise-memoized and runs later on demand).
4. **Suffix source — DECIDED: package version** (`APP_VERSION`). DB name = `SPFXEXT_COREDB_${APP_VERSION}`; it stays stable during development and only rolls to a fresh DB when the `package.json` version is bumped (manual, intentional). (`BUILD_DATE` and a `DEBUG` hybrid were considered and rejected to avoid per-build cache churn.)
5. **Dev-time schema evolution:** with a package-version suffix, changing the stores _without_ bumping the version leaves the old DB in place (stale schema). Mitigation: bump the version, clear IDB manually, or use the `DEBUG`→`BUILD_DATE` hybrid above.
6. **Orphaned DBs & open tabs:** old version-suffixed DBs linger — optionally delete non-current `${prefix}COREDB_*` via `indexedDB.databases()` on open. Also the `blocking` handler no longer fires across versions (different DB names don't block each other), so already-open tabs won't get the “new version, reload” prompt until they navigate — acceptable, but noted.
