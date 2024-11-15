import { registerAppInstanceService } from "./appInstanceService";
import { registerAppService } from "./appService";
import { registerGlobalListeners } from "./globalModernAppsListeners";
import { loadModernApps } from "./componentLoaderService";
import { initHistoryInterception } from "./historyService";
import { registerManifestWatcher } from "./manifestWatcherService";
import { SPFxExtensionCore } from "../../utilities/constants";
import { getHubSiteUrl } from "./hubDataService";
import { getSiteAbsoluteUrl, getWebAbsoluteUrl } from "./contextService";
import { getCoreConfig, initializeCoreConfiguration, } from "./coreConfigService";


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
  await initGlobal();

  const siteUrl = getSiteAbsoluteUrl();
  const webUrl = getWebAbsoluteUrl();
  const hubSiteUrl = await getHubSiteUrl();

  window.__SPFxExtensions.__CorePromiseResolver?.();
  loadModernApps(siteUrl, webUrl, hubSiteUrl);
  registerManifestWatcher(siteUrl, webUrl, hubSiteUrl);
  console.info(SPFxExtensionCore, "SPFx Extensions Core Has Been initialized.");
}
