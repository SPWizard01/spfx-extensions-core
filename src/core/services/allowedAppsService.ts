import {
  ALLOWEDAPPSLIST_ERROR,
  ALLOWEDAPPSLIST_NAME,
  SPFX_EXTENSIONS_DATA_SITE,
  SPFxExtensionCore,
} from "../../utilities/constants";

import { DEBUG_KEYS, isFileInDebug } from "../../utilities/debug";
import { getContextInfoAsync } from "../../services/spContextService";
import type { AllowedAppsListData } from "../../models/allowedAppsListData";
import { ensureAppWhiteList } from "./whiteListService";
import { addOrUpdateAllowedAppsToCache, evictAllowedAppsCache, getAllAllowedApps } from "./coreIdbService";
import { getCoreConfig } from "./coreConfigService";
import { getAppCatalogUrlCached } from "./appCatalogService";

const siteContextInfo = await getContextInfoAsync();
const appCatalogUrl = await getAppCatalogUrlCached();
const appConfigUrl = `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}`;

const webUrl =
  siteContextInfo.contextType === "ClassicContext"
    ? siteContextInfo.context.webAbsoluteUrl
    : siteContextInfo.context?.legacyPageContext.webAbsoluteUrl ?? "ERROR";

const AllowedAppsListDataPromise = fetchAllowedAppsListData();

async function fetchAllowedAppsListData() {
  try {
    const evicted = await evictAllowedAppsCache();
    const cachedData = await getAllAllowedApps();
    //there is cached data and nothing was evicted
    if (cachedData.length > 0 && !evicted) {
      return cachedData;
    }
    if (cachedData.length > 0) {
      console.info(SPFxExtensionCore, "Cache mismatch, loading allowed apps data...");
    }
    const coreConfig = await getCoreConfig();
    const appWhiteListEnabled = coreConfig.find(c => c.Title === "EnableAppWhiteList")?.Data === "true";
    if (!appWhiteListEnabled) {
      return [{ Id: 1, Title: "All apps allowed", EntryPointUrl: "*", date: new Date().toISOString(), expires: new Date().toISOString() }];
      ;
    }
    await ensureAppWhiteList();
    const url = `${appConfigUrl}/_api/web/lists/getByTitle('${ALLOWEDAPPSLIST_NAME}')/Items?$select=Id,Title,EntryPointUrl&$top=1000`;
    const allowedAppsListData = await fetchAllAllowedApps(url);
    await addOrUpdateAllowedAppsToCache(allowedAppsListData, 5);
    return allowedAppsListData;
  } catch (err) {
    console.error(SPFxExtensionCore, "Unable to load allowed apps data...", err);
    return [];
  }
}

async function fetchAllAllowedApps(url: string) {
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

function fileIsAllowed(
  fileNameWithPath: string,
  allowedList: AllowedAppsListData[]
) {
  const allAllowed = allowedList.some((e) => e.EntryPointUrl === "*");
  if (allAllowed) return true;
  return allowedList.some((allowedEntry) => {
    return fileNameWithPath
      .toLowerCase() === allowedEntry.EntryPointUrl.toLowerCase();
  });
}

export async function isFileAllowedInCurrentWeb(fileNameWithPath: string) {
  if (isFileInDebug(fileNameWithPath)) return true;

  // Service should load list data from whatever source which can be reached by everyone.
  const allowedList = await AllowedAppsListDataPromise;
  if (webUrl === "ERROR") {
    console.warn(ALLOWEDAPPSLIST_ERROR);
    return false;
  }
  if (!fileIsAllowed(fileNameWithPath, allowedList)) {
    console.warn(
      SPFxExtensionCore,
      "File",
      fileNameWithPath,
      `is not allowed to be executed. Please add it to whitelist in the app catalog @ ${appConfigUrl}. If you are a developer you can enable this app by adding localstorage item ${DEBUG_KEYS.SPFXEXT}[folderName] with a number value corresponding to development port of the localhost server.`
    );

    return false;
  }
  return true;
}
