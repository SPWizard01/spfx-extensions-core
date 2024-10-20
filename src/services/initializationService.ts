import { registerAppInstanceService } from "./appInstanceService";
import { registerAppService } from "./appService";
import { registerGlobalListeners } from "./globalModernAppsListeners";
import { loadModernApps } from "./componentLoaderService";
import { initHistoryInterception } from "./historyService";
import { registerManifestWatcher } from "./manifestWatcherService";
import { SPFxExtensionCore } from "../utilities/constants";
import { getHubSiteUrl } from "./hubDataService";
import { getContextInfoAsync } from "./spContextService";

function initGlobal() {
  //init once.
  if (window.__SPFxExtensions.__CoreInitialized) {
    return;
  }
  const historyInterceptEnabled = window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "InterceptHistory")?.Data === "true";
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
  initGlobal();

  const ctxInfo = await getContextInfoAsync();

  let siteUrl = "NO_ABSOLUTE_URL";
  let webUrl = "NO_ABSOLUTE_URL";
  let hubSiteId: string | null = null;
  let siteId: string | null = null;
  let hubSiteUrl = "";
  if (ctxInfo.contextType === "SPOModernContext") {
    siteUrl = ctxInfo.context.site.absoluteUrl;
    webUrl = ctxInfo.context.web.absoluteUrl;
    siteId = ctxInfo.context.legacyPageContext.siteId;
    hubSiteId = ctxInfo.context.legacyPageContext.hubSiteId;
  } else {
    siteUrl = ctxInfo.context.siteAbsoluteUrl;
    webUrl = ctxInfo.context.webAbsoluteUrl;
    siteId = ctxInfo.context.siteId;
    hubSiteId = ctxInfo.context.hubSiteId;
  }
  if (siteId) {
    siteId = siteId.replace("{", "").replace("}", "");
  }
  if (hubSiteId && siteId) {
    hubSiteUrl = await getHubSiteUrl(siteId, hubSiteId);
  }
  window.__SPFxExtensions.__CorePromiseResolver?.();
  loadModernApps(siteUrl, webUrl, hubSiteUrl);
  registerManifestWatcher(siteUrl, webUrl, hubSiteUrl);
  console.info(SPFxExtensionCore, "SPFx Extensions Core Has Been initialized.");
}
