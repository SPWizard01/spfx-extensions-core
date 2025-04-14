import { getCurrentContextId, getNewContext } from "../../utilities/helpers";
import { registerAppService } from "./appDefinitionService";
import { registerAppInstanceService } from "./appInstanceService";
import { cleanCacheOnUpgrade } from "./browserCache";
import { loadModernApps } from "./componentLoaderService";
import { initializeContextEventService } from "./contextEventService";
import {
  getSiteAbsoluteUrl,
  getWebAbsoluteUrl,
} from "./contextService";
import {
  getCoreConfig,
  initializeCoreConfiguration,
} from "./coreConfigService";
import { registerGlobalListeners } from "./globalModernAppsListeners";
import { initHistoryInterception } from "./historyService";
import { getHubSiteUrl } from "./hubDataService";
import { logGenericCoreInfo } from "./loggingService";
import { registerManifestWatcher } from "./manifestWatcherService";

let coreGlobalPromise: Promise<void> | undefined;
async function initGlobal() {
  //init once.
  if (coreGlobalPromise) {
    return coreGlobalPromise;
  }
  coreGlobalPromise = initGlobalInternal();
  return coreGlobalPromise;
}
async function initGlobalInternal() {
  await initializeCoreConfiguration();
  const coreConfig = await getCoreConfig();
  const historyInterceptEnabled =
    coreConfig.find((c) => c.Title === "InterceptHistory")?.Data === "true";
  if (historyInterceptEnabled) {
    initHistoryInterception();
  }
  initializeContextEventService();
  registerGlobalListeners();
  registerAppService();
  registerAppInstanceService();
  const { promise: assetPromise, resolve: assetPromiseResolver } =
    Promise.withResolvers<void>();
  if (!window.__SPFxExtensions.AllAppAssetsLoadedPromise) {
    window.__SPFxExtensions.AllAppAssetsLoadedPromise = assetPromise;
    window.__SPFxExtensions.AllAppAssetsLoadedResolver = assetPromiseResolver;
  }
}

/**
 * CRITICAL!!!! DO NOT CHANGE!!!
 */
export async function initCoreServices() {
  await cleanCacheOnUpgrade();
  await initGlobal();
  window.__SPFxExtensions.__CorePromiseResolver?.();

  const siteUrl = getSiteAbsoluteUrl();
  const webUrl = getWebAbsoluteUrl();
  const hubSiteUrl = await getHubSiteUrl();
  await loadModernApps(siteUrl, webUrl, hubSiteUrl, getCurrentContextId());
  window.addEventListener(
    "contextChange",
    async () => {
      const siteUrl = getSiteAbsoluteUrl();
      const webUrl = getWebAbsoluteUrl();
      const hubSiteUrl = await getHubSiteUrl();
      const newCtx = getNewContext();
      await loadModernApps(
        siteUrl,
        webUrl,
        hubSiteUrl,
        newCtx,
        true
      );
      registerManifestWatcher(siteUrl, webUrl, hubSiteUrl, true);
    }
  );
  registerManifestWatcher(siteUrl, webUrl, hubSiteUrl);
  logGenericCoreInfo("SPFx Extensions Core Has Been initialized.");
}
