import { SPFxExtensionCore } from "../../utilities/constants";
import { currentSiteIsRootHub, getHubSiteId, getSiteAbsoluteUrl } from "./contextService";
import { evictHubDataCache, getHubData, addOrUpdateHubDataToCache } from "./coreIdbService";


export async function getHubSiteUrl() {
  if (currentSiteIsRootHub()) {
    return "";
  }
  await evictHubDataCache();
  const hubSiteId = getHubSiteId();
  const cached = await getHubData(hubSiteId);
  if (!cached) {
    const siteUrl = getSiteAbsoluteUrl();
    console.info(
      SPFxExtensionCore,
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
      console.error(SPFxExtensionCore, "Error fetching hub site data.", e);
      return "";
    }
  }
  return cached.SiteUrl;
}
