import { currentSiteIsRootHub, getHubSiteId, getSiteAbsoluteUrl } from "./contextService";
import { addOrUpdateHubDataToCache, evictHubDataCache, getHubData } from "./coreIdbService";
import { logGenericCoreError, logGenericCoreInfo } from "./loggingService";

export async function getHubSiteUrl() {
  if (currentSiteIsRootHub()) {
    return "";
  }
  await evictHubDataCache();
  const hubSiteId = getHubSiteId();
  const cached = await getHubData(hubSiteId);
  if (!cached) {
    const siteUrl = getSiteAbsoluteUrl();
    logGenericCoreInfo(
      "Getting Hub data for HubSiteId:",
      hubSiteId
    );
    try {
      const hubSite = await fetch(
        `${siteUrl}/_api/hubsites/GetById?hubSiteId='${hubSiteId}'`,
        {
          headers: { accept: "application/json;odata=nometadata" },
        }
      );
      const hubSiteData = await hubSite.json();
      await addOrUpdateHubDataToCache(hubSiteData);
      return hubSiteData.SiteUrl;
    } catch (e) {
      logGenericCoreError("Error fetching hub site data.", e);
      return "";
    }
  }
  return cached.SiteUrl;
}
