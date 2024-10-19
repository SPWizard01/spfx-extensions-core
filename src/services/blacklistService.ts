import type { SPFxExtensionAppDefinition } from "../models/appModel";
import type {
  BlackListData,
  BlackListDataCache,
} from "../models/blackListData";
import {
  APPBLACKLIST_ERROR,
  APPBLACKLIST_ERROR_NO_URL,
  BLACKLIST_CACHE_KEY,
  BLACKLIST_NAME,
  SPFxExtensionCore,
} from "../utilities/constants";
import { getContextInfoAsync } from "./spContextService";

const siteContextInfo = await getContextInfoAsync();
const webUrl =
  siteContextInfo.contextType === "ClassicContext"
    ? siteContextInfo.context.webAbsoluteUrl
    : siteContextInfo.context?.legacyPageContext.webAbsoluteUrl ?? "ERROR";
if (webUrl === "ERROR") {
  console.error(APPBLACKLIST_ERROR_NO_URL);
}

const blacklistLoad: Promise<BlackListData[]> = new Promise(async (resolve) => {
  try {
    const cachedData = getCachedBlacklistData();
    if (cachedData) {
      resolve(cachedData);
      return;
    }
    const url = `${window.location.origin}/sites/appcatalog/_api/web/lists/getByTitle('${BLACKLIST_NAME}')/Items?$top=2000`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json;odata=verbose",
      },
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(JSON.stringify(json.error));
    }

    const blacklistData = json.d.results as BlackListData[];
    const nd = new Date();
    nd.setMinutes(nd.getMinutes() + 5);
    const toCache: BlackListDataCache = {
      data: blacklistData,
      expires: nd.toISOString(),
    };
    localStorage.setItem(BLACKLIST_CACHE_KEY, JSON.stringify(toCache));
    resolve(blacklistData);
  } catch (err) {
    console.error(SPFxExtensionCore, "Unable to load blacklist data...", err);
    resolve([]);
  }
});

function getCachedBlacklistData() {
  const data = localStorage.getItem(BLACKLIST_CACHE_KEY);
  const nowData = new Date();
  if (data) {
    const parsedData = JSON.parse(data) as BlackListDataCache;
    const expires = new Date(parsedData.expires);
    if (nowData > expires) {
      localStorage.removeItem(BLACKLIST_CACHE_KEY);
      return undefined;
    }
    return parsedData.data;
  }
}

export function blacklistData() {
  return blacklistLoad;
}

export async function isFileBlacklistedInCurrentWeb(fileName: string) {
  // Service should load blacklist list from whatever source which can be reached by everyone.
  const blacklist = await blacklistLoad;

  if (webUrl === "ERROR") {
    console.warn(APPBLACKLIST_ERROR);
    return false;
  }
  if (
    blacklist.some(
      (d) =>
        fileName.toLowerCase().indexOf(d.BlockedFileName?.toLowerCase()) > -1 &&
        webUrl.toLowerCase().indexOf(d.RelativeUrl?.toLowerCase()) > -1
    )
  ) {
    console.warn(SPFxExtensionCore, "Found blacklisted file", fileName, "for web", webUrl);
    return true;
  }
  return false;
}

export async function isAppBlacklistedInCurrentWeb(
  appDef: Omit<SPFxExtensionAppDefinition, "instances">
) {
  const blacklist = await blacklistLoad;
  if (
    blacklist.some(
      (d) =>
        (appDef.id.toLowerCase().indexOf(d.BlockedAppId?.toLowerCase()) > -1 ||
          appDef.name.toLowerCase() === d.Title?.toLowerCase()) &&
        webUrl.toLowerCase().indexOf(d.RelativeUrl?.toLowerCase()) > -1
    )
  ) {
    console.warn(
      SPFxExtensionCore,
      "Found blacklisted App",
      appDef.id,
      "with name",
      appDef.name,
      "for web",
      webUrl
    );
    return true;
  }
  return false;
}
