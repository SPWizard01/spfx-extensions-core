import type { AllowedAppsListData } from "../../models/allowedAppsListData";
import { ALLOWEDAPPSLIST_NAME } from "../../utilities/constants";
import { DEBUG_KEYS, isFileInDebug } from "../../utilities/debug";
import { SPFX_EXTENSIONS_SITE_URL } from "./appCatalogService";
import { getCoreConfig } from "./coreConfigService";
import {
  addOrUpdateAllowedAppsToCache,
  evictAllowedAppsCache,
  getAllAllowedAppsFromDB,
} from "./coreIdbService";
import { logGenericCoreError, logGenericCoreInfo, logGenericCoreWarning } from "./loggingService";

const AllowedAppsListDataPromise = getAllowedFilesDataCached();

async function getAllowedFilesDataCached() {
  try {
    const evicted = await evictAllowedAppsCache();
    const cachedData = await getAllAllowedAppsFromDB();
    //there is cached data and nothing was evicted
    if (cachedData.length > 0 && !evicted) {
      return cachedData;
    }
    if (cachedData.length > 0) {
      logGenericCoreInfo("Cache mismatch, loading allowed apps data...");
    }
    const allowedAppsListData = await getAllowedFilesFromApi();
    await addOrUpdateAllowedAppsToCache(allowedAppsListData, 5);
    return allowedAppsListData;
  } catch (err) {
    logGenericCoreError("Unable to load allowed apps data...", err);
    return [];
  }
}

export async function getAllowedFilesFromApi(fresh = false) {
  const coreConfig = await getCoreConfig(fresh);
  const appWhiteListEnabled =
    coreConfig.find((c) => c.Title === "EnableAppWhiteList")?.Data === "true";
  if (!appWhiteListEnabled) {
    return [
      {
        Id: 1,
        Title: "All apps allowed",
        EntryPointUrl: "*",
        date: new Date().toISOString(),
        expires: new Date().toISOString(),
      },
    ];
  }
  return fetchAllowedFilesFromListInternal();
}

async function fetchAllowedFilesFromListInternal() {
  const url = `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/getByTitle('${ALLOWEDAPPSLIST_NAME}')/Items?$select=Id,Title,EntryPointUrl&$top=1000`;
  const allowedAppsListData = await fetchAllowedFilesWithIterate(url);
  return allowedAppsListData;
}

async function fetchAllowedFilesWithIterate(url: string) {
  let fetchUrl = url;
  const allowedAppsListData: AllowedAppsListData[] = [];
  while (fetchUrl) {
    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json;odata=verbose",
      },
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(JSON.stringify(json.error));
    }
    allowedAppsListData.push(...(json.d.results as AllowedAppsListData[]));
    fetchUrl = json.d.__next;
  }

  return allowedAppsListData;
}

function fileIsAllowed(absoluteFileUrl: URL, allowedList: AllowedAppsListData[]) {
  const allAllowed = allowedList.some((e) => e.EntryPointUrl === "*");
  if (allAllowed) return true;
  const fileOriginAndPath = (absoluteFileUrl.origin + absoluteFileUrl.pathname).toLowerCase();
  return allowedList.some((allowedEntry) => {
    try {
      const entryURL = new URL(allowedEntry.EntryPointUrl);
      const entryOriginAndPath = entryURL.origin + entryURL.pathname;
      return fileOriginAndPath === entryOriginAndPath.toLowerCase();
    } catch (err) {
      logGenericCoreError("Error while parsing allowed entry URL", allowedEntry.EntryPointUrl, err);
      return false;
    }
  });
}

export async function isFileAllowedToRun(
  absoluteFileUrl: URL,
  manifestName: string,
  fresh = false
) {
  if (isFileInDebug(absoluteFileUrl)) return true;

  // Service should load list data from whatever source which can be reached by everyone.
  const allowedList = fresh
    ? await getAllowedFilesFromApi(fresh)
    : await AllowedAppsListDataPromise;
  if (!fileIsAllowed(absoluteFileUrl, allowedList)) {
    logGenericCoreWarning(
      "File",
      absoluteFileUrl,
      `is not allowed to be executed. Please add it to whitelist @ ${SPFX_EXTENSIONS_SITE_URL}.`
    );
    logGenericCoreWarning(
      `If you are a developer you can enable this app by adding window.localStorage item ${DEBUG_KEYS.SPFXEXT}${manifestName} with a number value corresponding to development port of the localhost server.`
    );

    return false;
  }
  return true;
}
