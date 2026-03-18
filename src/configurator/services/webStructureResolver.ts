import type { IWebInfo } from "@pnp/sp/webs";
import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import { EMPTY_GUID } from "../../utilities/constants";
import type { HubResultSitesResponse } from "../models/HubResultResponse";
import type { HubUrlCollectionItem, SiteUrlCollectionItem } from "../models/StructureModels";

export function spliceHub(itemsToSplice: SPFxExtensionUrlMapItem[], hubId: string) {
  const hubRootIdx = itemsToSplice.findIndex((s) => s.isHubRoot && s.hubid === hubId);
  if (hubRootIdx < 0) {
    return undefined;
  }
  const splicedRoot = itemsToSplice.splice(hubRootIdx, 1)[0];
  const rootSite = {
    ...splicedRoot,
    webs: [splicedRoot],
  };
  const hubRoot: HubUrlCollectionItem = {
    ...splicedRoot,
    sites: [rootSite],
    webs: [],
  };
  const hubSubWebsToPush: SPFxExtensionUrlMapItem[] = spliceWebs(
    itemsToSplice,
    hubRoot.siteId,
    hubId
  );
  rootSite.webs.push(...hubSubWebsToPush);
  const hubSitesToPush = spliceSites(itemsToSplice, hubId);
  hubRoot.sites.push(...hubSitesToPush);
  hubRoot.webs.push(...spliceWebs(itemsToSplice, hubRoot.siteId, hubId));
  //anything left in the itemsToSplice is not part of this hub, so we return it back to the caller
  return hubRoot;
}

export function getGlobalStructure(defaultList: SPFxExtensionUrlMapItem[]) {
  const allGroupedByHub = Object.groupBy(defaultList, (item) => item.hubid);
  const nonEmptyHubKeys = Object.keys(allGroupedByHub).filter((k) => k && k !== EMPTY_GUID);
  const nonHubKeys = Object.keys(allGroupedByHub).filter((k) => !k || k === EMPTY_GUID);

  const allHubItems = nonEmptyHubKeys.map((k) => allGroupedByHub[k] ?? []).flat();
  const allNonHubItems = nonHubKeys.map((k) => allGroupedByHub[k] ?? []).flat();

  const hubResults: HubUrlCollectionItem[] = [];

  const siteResults: SiteUrlCollectionItem[] = [];
  const webResults: SPFxExtensionUrlMapItem[] = [];

  for (const hubId of nonEmptyHubKeys) {
    const splicedData = spliceHub(allHubItems, hubId);
    if (!splicedData) continue;
    hubResults.push(splicedData);
  }
  // has anything unspliced left
  if (allHubItems.length > 0) {
    allNonHubItems.push(...allHubItems);
  }
  siteResults.push(...spliceSites(allNonHubItems));
  webResults.push(...allNonHubItems);

  // for (const otherKey of nonHubKeys) {
  //     const otherItems = allGroupedByHub[otherKey];
  //     if (!otherItems) continue;
  //     const allGroupedBySite = Object.groupBy(otherItems, (item) => item.siteId);
  //     const nonEmptySiteKeys = Object.keys(allGroupedBySite).filter(
  //         (k) => k && k !== EMPTY_GUID
  //     );
  //     const otherSiteKeys = Object.keys(allGroupedBySite).filter(
  //         (k) => !k || k === EMPTY_GUID
  //     );
  //     for (const siteKey of nonEmptySiteKeys) {
  //         const siteItems = allGroupedBySite[siteKey];
  //         if (!siteItems) continue;
  //         const splicedData = spliceSites(siteItems);
  //         if (splicedData.length > 0) {
  //             siteResults.push(...splicedData);
  //         } else {
  //             webResults.push(...siteItems);
  //         }

  //     }
  //     for (const webKey of otherSiteKeys) {
  //         const webItems = allGroupedBySite[webKey];
  //         if (!webItems) continue;
  //         webResults.push(...webItems);
  //     }
  // }
  return {
    hubs: hubResults,
    sites: siteResults,
    webs: webResults,
  };
}

export function spliceSites(itemsToSplice: SPFxExtensionUrlMapItem[], hubId?: string) {
  const sitesToPush: SiteUrlCollectionItem[] = [];
  function indexFinder(s: SPFxExtensionUrlMapItem) {
    return hubId ? s.isRootWeb && s.hubid === hubId : s.isRootWeb;
  }
  let siteIdx = itemsToSplice.findIndex(indexFinder);
  while (siteIdx > -1) {
    const siteItem = itemsToSplice.splice(siteIdx, 1)[0];
    let inSiteCollection = sitesToPush.find((s) => s.id === siteItem.id);
    if (!inSiteCollection) {
      inSiteCollection = {
        ...siteItem,
        webs: [siteItem],
      };
      sitesToPush.push(inSiteCollection);
    }
    const websToPush: SPFxExtensionUrlMapItem[] = spliceWebs(itemsToSplice, siteItem.siteId);
    inSiteCollection.webs.push(...websToPush.sort((a, b) => a.url.localeCompare(b.url)));
    siteIdx = itemsToSplice.findIndex(indexFinder);
  }
  return sitesToPush;
}

export function spliceWebs(copyItems: SPFxExtensionUrlMapItem[], siteId: string, hubId?: string) {
  const websToPush: SPFxExtensionUrlMapItem[] = [];
  function indexFinder(s: SPFxExtensionUrlMapItem) {
    return hubId ? s.siteId === siteId && s.hubid === hubId : s.siteId === siteId;
  }
  let webIdx = copyItems.findIndex(indexFinder);
  while (webIdx > -1) {
    const webItem = copyItems.splice(webIdx, 1)[0];
    websToPush.push(webItem);
    webIdx = copyItems.findIndex(indexFinder);
  }
  return websToPush.sort((a, b) => a.url.localeCompare(b.url));
}

export function hubResponseToMapItem(responseItems: HubResultSitesResponse[]) {
  //sharepoint api does not expose a property which is saying that that web is a root web, so we will sort by the url of site collection
  //shortest url will be the root web of the site collection
  const groupedByCollection = Object.groupBy(responseItems, (item) => item.sharepointIds.siteId);
  const collectionKeys = Object.keys(groupedByCollection);
  const siteCollections: SPFxExtensionUrlMapItem[] = [];
  for (const collectionKey of collectionKeys) {
    const collection = groupedByCollection[collectionKey];
    if (!collection) continue;
    const sortedByUrl = collection.sort((a, b) => a.webUrl.localeCompare(b.webUrl));
    siteCollections.push({
      id: sortedByUrl[0].sharepointIds.webId,
      url: sortedByUrl[0].webUrl,
      siteId: sortedByUrl[0].sharepointIds.siteId,
      hubid: sortedByUrl[0].sharepointIds.hubSiteId,
      isHubRoot: sortedByUrl[0].sharepointIds.hubSiteId === sortedByUrl[0].sharepointIds.siteId,
      isRootWeb: true,
    });
  }

  const mapItems: SPFxExtensionUrlMapItem[] = responseItems.map((item) => {
    return {
      id: item.sharepointIds.webId,
      url: item.webUrl,
      siteId: item.sharepointIds.siteId,
      hubid: item.sharepointIds.hubSiteId,
      isHubRoot: item.sharepointIds.hubSiteId === item.sharepointIds.siteId,
      isRootWeb: siteCollections.some((s) => s.id === item.sharepointIds.webId),
      title: item.title,
      template: item.template.name,
    };
  });
  return mapItems;
}

export function webInfoToMapItem(
  webInfo: IWebInfo,
  siteId: string,
  hubId: string
): SPFxExtensionUrlMapItem {
  return {
    id: webInfo.Id,
    url: webInfo.Url,
    siteId: siteId,
    hubid: hubId,
    isHubRoot: false,
    isRootWeb: false,
  };
}

export function webInfoToMapItems(
  webInfos: IWebInfo[],
  siteId: string,
  hubId: string
): SPFxExtensionUrlMapItem[] {
  return webInfos.map((webInfo) => {
    return webInfoToMapItem(webInfo, siteId, hubId);
  });
}
