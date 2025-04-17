import { SPBrowser, type SPFI } from "@pnp/sp";
import "@pnp/sp/hubSites";
import type { ISiteInfo } from "@pnp/sp/sites/types";
import { SPCollection } from "@pnp/sp/spqueryable";
import type { IWebInfo } from "@pnp/sp/webs";
import { logGenericCoreError, logGenericCoreWarning } from "../../core/services/loggingService";
import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import { EMPTY_GUID } from "../../utilities/constants";
import type { ApiCallResult } from "../models/apiCallResult";
import type { HubResultResponse, HubResultSitesResponse } from "../models/HubResultResponse";
import type { HubUrlCollectionItem, SiteUrlCollectionItem } from "../models/UrlCollectionMapItem";
import { configurationRootWeb, configurationSite, configurationSiteStructure, configurationWeb, getConfigurationWebIsRootHub, getConfigurationWebIsSite } from "../runtimeStore";
import { getPnPSP } from "./pnpService";
import { hubResponseToMapItem, spliceHub, spliceSites, spliceWebs, webInfoToMapItem } from "./webStructureResolver";
export async function getAllWebInfos(sp: SPFI) {
  const thisWeb = configurationWeb;
  if (thisWeb.isError) {
    logGenericCoreError("Unable to get web info", thisWeb.error);
    return [];
  }
  const allSubwebs = await getWebs(sp);
  if (allSubwebs.isError) {
    logGenericCoreError("Unable to get web info", allSubwebs.error);
    return [];
  }
  const recursiveWebs = await getWebInfoRecursiveResult(allSubwebs.data);
  return [thisWeb.data, ...allSubwebs.data, ...recursiveWebs.filter(r => !r.isError).flatMap(d => d.data)];
}

async function getWebInfoRecursiveResult(webs: IWebInfo[]) {

  const infoPromises: Promise<ApiCallResult<IWebInfo[]>>[] = [];
  for (const webInfo of webs) {
    const webSp = getPnPSP(webInfo.Url);
    infoPromises.push(getWebs(webSp));
  }
  const infoResult = await Promise.all(infoPromises)
  const mapForRecursion = infoResult.filter((r) => !r.isError && r.data.length > 0).flatMap((r) => r.data);
  if (mapForRecursion.length > 0) {
    infoResult.push(...(await getWebInfoRecursiveResult(mapForRecursion)));
  }
  return infoResult.some(r => r.data.length > 0 || r.isError) ? infoResult : [];
}

export async function resolveWebStructure(webUrl: URL) {
  const sp = getPnPSP(webUrl.origin + webUrl.pathname);

  const webStructure: ApiCallResult<SPFxExtensionUrlMapItem[]> = {
    data: [],
    error: "",
    warnings: [],
    isError: false,
  };
  try {
    const site = await getSite(sp);
    if (site.isError) {
      const siteErr = `Unable to get site info ${site.error}`;
      webStructure.warnings.push(siteErr);
      logGenericCoreError(siteErr, webUrl.href);
    }
    const rootWeb = await getRootWeb(sp);
    if (rootWeb.isError) {
      const rwErr = `Unable to get root web info ${rootWeb.error}`;
      webStructure.warnings.push(rwErr);
      logGenericCoreError(rwErr, webUrl.href);
    }
    const webInfos = await getAllWebInfos(sp);
    webInfos.forEach((webInfo) => {
      webStructure.data.push({
        id: webInfo.Id,
        siteId: site.data?.Id ?? EMPTY_GUID,
        hubid: site.data?.HubSiteId ?? EMPTY_GUID,
        url: webInfo.Url,
        isRootWeb: webInfo.Id === rootWeb.data?.Id,
        isHubRoot: site.data?.IsHubSite && webInfo.Id === rootWeb.data?.Id,
      });
    });
  } catch (error) {
    webStructure.isError = true;
    webStructure.error = `${error}`;
    logGenericCoreError("Unable to get web structure", webUrl.href, error);
  }
  return webStructure;
}

async function _getWebStructure(sp: SPFI) {
  const web = await getWeb(sp);
  const returnResult: SPFxExtensionUrlMapItem[] = []
  if (web.isError) {
    logGenericCoreError(`Unable to get web info ${web.error}`);
    return returnResult;
  }
  returnResult.push({
    id: web.data.Id,
    url: web.data.Url,
    hubid: EMPTY_GUID,
    siteId: EMPTY_GUID,
    isHubRoot: false,
    isRootWeb: false,
  })
  const subWebs = await getWebs(sp);
  if (subWebs.isError) {
    logGenericCoreError(`Unable to get subwebs info ${subWebs.error}`);
    return returnResult;
  }

  const recursiveWebs = await getWebInfoRecursiveResult(subWebs.data);
  const rootSubWebsMap = webInfoToMapItem(subWebs.data, EMPTY_GUID, EMPTY_GUID);
  const subWebsMap = webInfoToMapItem(recursiveWebs.filter(r => !r.isError).flatMap(d => d.data), EMPTY_GUID, EMPTY_GUID);
  const allWebsMap = [...rootSubWebsMap, ...subWebsMap];
  returnResult.push(...spliceWebs(allWebsMap, EMPTY_GUID));
  return returnResult
}

export async function getSiteStructure(sp: SPFI) {
  if (!getConfigurationWebIsSite()) {
    return undefined;
  }
  const site = configurationSite

  let returnResult: SiteUrlCollectionItem = {
    hubid: EMPTY_GUID,
    id: EMPTY_GUID,
    url: "",
    siteId: EMPTY_GUID,
    isHubRoot: false,
    isRootWeb: false,
    webs: []
  }
  if (site.isError) {
    logGenericCoreError(`Unable to get site info ${site.error}`);
    return returnResult;
  }
  const rootWeb = configurationRootWeb;
  if (rootWeb.isError) {
    logGenericCoreError(`Unable to get root web info ${rootWeb.error}`);
    return returnResult;
  }
  const rootSubwebs = await getRootWebWebs(sp);
  if (rootSubwebs.isError) {
    logGenericCoreError(`Unable to get root subweb info ${rootWeb.error}`);
    return returnResult;
  }
  const recursiveWebs = await getWebInfoRecursiveResult(rootSubwebs.data);
  const rootSubWebsMap = webInfoToMapItem(rootSubwebs.data, site.data.Id, site.data.HubSiteId);
  const subWebsMap = webInfoToMapItem(recursiveWebs.filter(r => !r.isError).flatMap(d => d.data), site.data.Id, site.data.HubSiteId);
  const allWebsMap = [...rootSubWebsMap, ...subWebsMap];
  const siteResult: SPFxExtensionUrlMapItem = {
    hubid: site.data.HubSiteId,
    id: rootWeb.data.Id,
    url: rootWeb.data.Url,
    siteId: site.data.Id,
    isHubRoot: site.data.IsHubSite,
    isRootWeb: true,
  }
  returnResult = {
    ...siteResult,
    webs: [
      siteResult,
      ...spliceWebs(allWebsMap, site.data.Id)
    ],
  }
  return returnResult
}




export async function getHubStructure(sp: SPFI, additionalMapItems: SPFxExtensionUrlMapItem[], suppliedHubId?: string) {
  if (!getConfigurationWebIsRootHub()) {
    return undefined;
  }
  if (!configurationSiteStructure) {
    return undefined;
  }
  const hubSiteId = suppliedHubId ?? configurationSite.data.HubSiteId;
  const allHubItems: HubResultSitesResponse[] = [];
  for await (const chunk of getHubStructureGenerator(sp.web.toUrl().replace("_api/web", ""), hubSiteId)) {
    allHubItems.push(...chunk);
  };
  const resolvedStructure: HubUrlCollectionItem = {
    id: "",
    url: "",
    siteId: hubSiteId,
    hubid: hubSiteId,
    isHubRoot: true,
    isRootWeb: true,
    sites: [],
    webs: [],
  };
  const remainingItems = hubResponseToMapItem(allHubItems);
  const hubRootIdx = remainingItems.findIndex((s) => s.hubid === hubSiteId && s.siteId === hubSiteId);
  let hubRoot = hubRootIdx > -1 ? remainingItems.splice(hubRootIdx, 1)[0] : undefined;
  if (!hubRoot) {
    logGenericCoreWarning("API Call did not return Hub ROOT", hubSiteId);
    hubRoot = {
      id: configurationRootWeb.data.Id,
      url: configurationRootWeb.data.Url,
      hubid: hubSiteId,
      siteId: hubSiteId,
      isHubRoot: true,
      isRootWeb: true,
    }
  }
  resolvedStructure.id = hubRoot.id;
  resolvedStructure.url = hubRoot.url;
  resolvedStructure.hubid = hubRoot.hubid;
  resolvedStructure.siteId = hubRoot.siteId;
  resolvedStructure.sites.push({
    ...hubRoot,
    webs: [hubRoot],
  })

  const hubSubWebsToPush: SPFxExtensionUrlMapItem[] = spliceWebs(
    remainingItems,
    hubRoot.siteId
  );
  const rootSite = resolvedStructure.sites.find((s) => s.id === hubRoot.id);
  if (rootSite) {
    rootSite.webs.push(...hubSubWebsToPush);
  }
  else {
    resolvedStructure.webs.push(...hubSubWebsToPush);
  }
  const hubSitesToPush = spliceSites(remainingItems);
  resolvedStructure.sites.push(...hubSitesToPush);
  resolvedStructure.webs.push(...remainingItems);
  for (const element of configurationSiteStructure.webs.sort((a, b) => a.url.localeCompare(b.url))) {
    if (resolvedStructure.sites.flatMap(s => s.webs).findIndex(w => w.id === element.id) === -1) {
      const foundSiteIdx = resolvedStructure.sites.findIndex(s => s.siteId === element.siteId);
      if (foundSiteIdx < 0) {
        resolvedStructure.sites.push({
          id: element.id,
          url: element.url,
          hubid: element.hubid,
          siteId: element.siteId,
          isHubRoot: false,
          isRootWeb: true,
          webs: [element],
        });
        continue;
      }
      resolvedStructure.sites[foundSiteIdx].webs.push(element);
      resolvedStructure.sites[foundSiteIdx].webs = resolvedStructure.sites[foundSiteIdx].webs.sort((a, b) => a.url.localeCompare(b.url));
    }
  }
  //add sites that ar in context config
  const additionalHubInfo = spliceHub([...additionalMapItems], hubSiteId);
  if (additionalHubInfo) {
    for (const additionalSiteInfo of additionalHubInfo.sites) {
      const foundSites = resolvedStructure.sites.find(s => s.id === additionalSiteInfo.id);
      if (foundSites) {
        for (const additionalWebInfo of additionalSiteInfo.webs) {
          const foundWebs = foundSites.webs.find(w => w.id === additionalWebInfo.id);
          if (foundWebs) {
            continue;
          } else {
            foundSites.webs.push(additionalWebInfo);
          }
        }
        foundSites.webs = foundSites.webs.sort((a, b) => a.url.localeCompare(b.url));
        continue;
      }
      resolvedStructure.sites.push(additionalSiteInfo);
    }
    for (const additionalWebInfo of additionalHubInfo.webs) {
      const foundWebs = resolvedStructure.webs.find(w => w.id === additionalWebInfo.id);
      if (foundWebs) {
        continue;
      } else {
        resolvedStructure.webs.push(additionalWebInfo);
      }
    }
  }

  const toRemove: SPFxExtensionUrlMapItem[] = [];
  for (const unstructuredWeb of resolvedStructure.webs) {
    const hasCorrespondingSiteEntry = resolvedStructure.sites.find(s => s.id === unstructuredWeb.siteId);
    if (!hasCorrespondingSiteEntry) {
      continue;
    }
    toRemove.push({ ...unstructuredWeb });
    const hasWebEntry = hasCorrespondingSiteEntry.webs.find(s => s.id === unstructuredWeb.id);
    if (!hasWebEntry) {
      hasCorrespondingSiteEntry.webs.push({ ...unstructuredWeb });
      hasCorrespondingSiteEntry.webs = hasCorrespondingSiteEntry.webs.sort((a, b) => a.url.localeCompare(b.url));
    }
  }

  resolvedStructure.webs = resolvedStructure.webs.filter(w => toRemove.findIndex(r => r.id === w.id) > -1);
  resolvedStructure.webs = resolvedStructure.webs.sort((a, b) => a.url.localeCompare(b.url));
  return resolvedStructure;
}

async function* getHubStructureGenerator(queryUrl: string, hubSiteId: string, initial = true): AsyncGenerator<HubResultSitesResponse[]> {
  const initialRequest = SPCollection(queryUrl, initial ? "_api/v2.1/sites" : "").using(SPBrowser())<HubResultResponse>
  if (initial) {
    initialRequest
      .filter(`sharepointIds/hubSiteId eq '${hubSiteId}'`).top(99);
  }
  initialRequest.on.parse.replace(async (url, response, result) => {
    const emptyResult: HubResultResponse = {
      "@odata.context": "",
      value: [],
      "@odata.nextLink": "",
    }
    if (response.ok) {
      try {
        result = await response.json() as HubResultResponse;
        return [url, response, result];
      }
      catch (error) {
        logGenericCoreError("Unable to parse hubdata response", url, error);
        return [url, response, emptyResult];
      }
    }
    logGenericCoreError("Error getting hubdata", url, response.statusText);
    return [url, response, emptyResult];
  });
  const initialResponse = await initialRequest();
  yield initialResponse.value;
  if (initialResponse["@odata.nextLink"]) {
    yield* getHubStructureGenerator(initialResponse["@odata.nextLink"], hubSiteId, false);
  }
}

export async function getRootWeb(sp: SPFI) {
  return fetchSPData(() => sp.site.rootWeb(), {} as IWebInfo);
}

export async function getRootWebWebs(sp: SPFI) {
  return fetchSPData(() => sp.site.rootWeb.webs(), []);
}

export async function getSite(sp: SPFI) {
  return fetchSPData(() => sp.site(), {} as ISiteInfo);
}

export async function getWeb(sp: SPFI) {
  return fetchSPData(() => sp.web(), {} as IWebInfo);
}

export async function getWebs(sp: SPFI) {
  return fetchSPData(() => sp.web.webs(), []);
}

async function fetchSPData<T>(
  fetchFn: () => Promise<T>,
  defaultValue: T
): Promise<ApiCallResult<T>> {
  const result: ApiCallResult<T> = {
    data: defaultValue,
    error: "",
    warnings: [],
    isError: false,
  };
  try {
    const data = await fetchFn();
    result.data = data;
  } catch (error) {
    result.isError = true;
    result.error = `${error}`;
  }
  return result;
}
