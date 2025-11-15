import type { ContextChangeEventDetails } from "../../models/customEvents";
import { EMPTY_GUID } from "../../utilities/constants";
import { getHubSiteId, getIsHubSite, getSiteAbsoluteUrl, getSiteId } from "./contextService";
import { addOrUpdateHubDataToCache, evictHubDataCache, getHubData } from "./coreIdbService";
import { logGenericCoreError, logGenericCoreInfo } from "./loggingService";

export async function getHubSiteUrl() {
  const isHubsite = getIsHubSite();
  if (isHubsite) {
    return "";
  }
  const hubSiteId = getHubSiteId();
  const siteId = getSiteId();
  // hubid is null or is empty guid or current subsite belongs to a site which is a hub site;
  if (!hubSiteId || hubSiteId === EMPTY_GUID || hubSiteId === siteId) {
    return "";
  }
  await evictHubDataCache();
  const cached = await getHubData(hubSiteId);
  if (!cached) {
    logGenericCoreInfo("Getting Hub data for HubSiteId:", hubSiteId);
    try {
      const hubSite = await fetch(`/_api/hubsites/GetById?hubSiteId='${hubSiteId}'`, {
        headers: { accept: "application/json;odata=nometadata" },
      });
      const hubSiteData = await hubSite.json();
      await addOrUpdateHubDataToCache(hubSiteData);
      return hubSiteData.SiteUrl as string;
    } catch (e) {
      logGenericCoreError("Error fetching hub site data.", e);
      return "";
    }
  }
  return cached.SiteUrl;
}

export async function getHubSiteUrlFromEvent(event: CustomEvent<ContextChangeEventDetails>) {
  const isHubsite = event.detail.legacyContext.isHubSite;
  if (isHubsite) {
    return "";
  }
  const hubSiteId = event.detail.legacyContext.hubSiteId;
  const siteId = event.detail.legacyContext.siteId;
  // hubid is null or is empty guid or current subsite belongs to a site which is a hub site;
  if (!hubSiteId || hubSiteId === EMPTY_GUID || hubSiteId === siteId) {
    return "";
  }
  await evictHubDataCache();
  const cached = await getHubData(hubSiteId);
  if (!cached) {
    logGenericCoreInfo("Getting Hub data for HubSiteId:", hubSiteId);
    try {
      const hubSite = await fetch(`/_api/hubsites/GetById?hubSiteId='${hubSiteId}'`, {
        headers: { accept: "application/json;odata=nometadata" },
      });
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
