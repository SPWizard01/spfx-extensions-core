import { registerAppService } from "./appDefinitionService";
import { registerAppInstanceService } from "./appInstanceService";
import { cleanCacheOnUpgrade } from "./browserCache";
import { loadModernApps } from "./componentLoaderService";
import { getSiteAbsoluteUrl, getWebAbsoluteUrl } from "./contextService";
import { getCoreConfig, initializeCoreConfiguration, } from "./coreConfigService";
import { registerGlobalListeners } from "./globalModernAppsListeners";
import { initHistoryInterception } from "./historyService";
import { getHubSiteUrl } from "./hubDataService";
import { logGenericCoreInfo } from "./loggingService";
import { registerManifestWatcher } from "./manifestWatcherService";


let coreGlobalPromise: Promise<void> | undefined;
async function initGlobal() {
  if (coreGlobalPromise) {
    return coreGlobalPromise;
  }
  coreGlobalPromise = initGlobalInternal();
  return coreGlobalPromise;
}
async function initGlobalInternal() {
  //init once.
  if (window.__SPFxExtensions.__CoreInitialized) {
    return;
  }
  await initializeCoreConfiguration();
  const coreConfig = await getCoreConfig();
  const historyInterceptEnabled = coreConfig.find(c => c.Title === "InterceptHistory")?.Data === "true";
  if (historyInterceptEnabled) {
    initHistoryInterception();
  }
  registerGlobalListeners();
  registerAppService();
  registerAppInstanceService();

  if (!window.__SPFxExtensions.AllAppAssetsLoadedPromise) {
    window.__SPFxExtensions.AllAppAssetsLoadedPromise = new Promise(
      (resolve) => {
        window.__SPFxExtensions.AllAppAssetsLoadedResolver = resolve;
      }
    );
  }
  window.__SPFxExtensions.__CoreInitialized = true;
}

/**
 * CRITICAL!!!! DO NOT CHANGE!!!
 */
export async function initCoreServices() {
  await cleanCacheOnUpgrade();
  await initGlobal();

  const siteUrl = getSiteAbsoluteUrl();
  const webUrl = getWebAbsoluteUrl();
  const hubSiteUrl = await getHubSiteUrl();
  //getRootWebId(siteUrl)
  //TODO: figure out what to do with all apps when context change (i.e. to a completely different site)
  window.__SPFxExtensions.__CorePromiseResolver?.();
  await loadModernApps(siteUrl, webUrl, hubSiteUrl);
  registerManifestWatcher(siteUrl, webUrl, hubSiteUrl);
  logGenericCoreInfo("SPFx Extensions Core Has Been initialized.");
}
