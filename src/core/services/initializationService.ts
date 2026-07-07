import { getContextInfoAsync } from "../../services/spContextService";
import { getCurrentContextId, getNewContext } from "../../utilities/helpers";
import { registerAppService } from "./appDefinitionService";
import { registerAppInstanceService } from "./appInstanceService";
import { cleanCacheOnUpgrade } from "./browserCache";
import { loadModernApps } from "./componentLoaderService";
import { registerConfigWatcher } from "./configWatcherService";
import { initializeContextEventService } from "./contextEventService";
import { getBooleanCoreConfig, initializeCoreConfiguration } from "./coreConfigService";
import { registerGlobalListeners } from "./globalModernAppsListeners";
import { initHistoryInterception } from "./historyService";
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

async function initContextData() {
  window.__SPFxExtensions.__CurrentContext = await getContextInfoAsync();
}

async function initGlobalInternal() {
  await initializeCoreConfiguration();
  const historyInterceptEnabled = await getBooleanCoreConfig("InterceptHistory");
  if (historyInterceptEnabled) {
    initHistoryInterception();
  }
  initializeContextEventService();
  registerGlobalListeners();
  registerAppService();
  registerAppInstanceService();
  const { promise, resolve } = Promise.withResolvers<void>();
  if (!window.__SPFxExtensions.AllAppAssetsLoadedPromise) {
    window.__SPFxExtensions.AllAppAssetsLoadedPromise = promise;
    window.__SPFxExtensions.AllAppAssetsLoadedResolver = resolve;
  }
}

/**
 * CRITICAL!!!! DO NOT CHANGE!!!
 */
export async function initCoreServices() {
  await cleanCacheOnUpgrade();
  await initGlobal();
  //called only once because context is a singleton which will be updated by SPO itself on context change/update.
  await initContextData();
  window.__SPFxExtensions.__CorePromiseResolver();

  await loadModernApps();
  window.addEventListener("contextChange", async (event) => {
    logGenericCoreInfo("Context changed, reloading apps...");
    await loadModernApps(true);
    registerManifestWatcher(true);
  });
  registerManifestWatcher();
  registerConfigWatcher();
  logGenericCoreInfo("SPFx Extensions Core Has Been initialized.");
}
