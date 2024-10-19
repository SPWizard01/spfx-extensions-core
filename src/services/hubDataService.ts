import { SPFxExtensionCore } from "../utilities/constants";
import {
  addOrUpdateHubDataToCache,
  evictHubDataCache,
  getHubData,
} from "./idbService";

export async function getHubSiteUrl(siteId: string, hubSiteId: string) {
  await evictHubDataCache();
  if (
    siteId.toLowerCase() === hubSiteId.toLowerCase() ||
    hubSiteId === "00000000-0000-0000-0000-000000000000"
  ) {
    return "";
  }
  console.info(
    SPFxExtensionCore,
    "Hub site detected. SiteId:",
    siteId,
    "HubSiteId:",
    hubSiteId
  );
  const cached = await getHubData(hubSiteId);
  if (!cached) {
    try {
      const hubSite = await fetch(
        `/_api/hubsites/GetById?hubSiteId='${hubSiteId}'`,
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
