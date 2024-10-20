import {
  ALLOWEDAPPSLIST_ERROR,
  ALLOWEDAPPSLIST_NAME,
  SPFxExtensionCore,
} from "../utilities/constants";
import {
  addOrUpdateAllowedAppsToCache,
  evictAllowedAppsCache,
  getAllAllowedApps,
} from "./idbService";
import { isInDebug } from "../utilities/debug";
import { getContextInfoAsync } from "./spContextService";
import type { AllowedAppsListData } from "../models/allowedAppsListData";
import type { SPFxExtensionAppRegistration } from "../models/appModel";

const siteContextInfo = await getContextInfoAsync();
const webUrl =
  siteContextInfo.contextType === "ClassicContext"
    ? siteContextInfo.context.webAbsoluteUrl
    : siteContextInfo.context?.legacyPageContext.webAbsoluteUrl ?? "ERROR";

const AllowedAppsListDataPromise: Promise<AllowedAppsListData[]> = new Promise(
  async (resolve) => {
    try {
      const evicted = await evictAllowedAppsCache();
      const cachedData = await getAllAllowedApps();
      //there is cached data and nothing was evicted
      if (cachedData.length > 0 && !evicted) {
        resolve(cachedData);
        return;
      }
      if (cachedData.length > 0) {
        console.info(SPFxExtensionCore, "Cache mismatch, loading allowed apps data...");
      }

      const appWhiteListEnabled = window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "EnableAppWhiteList")?.Data === "true";
      if (!appWhiteListEnabled) {
        resolve([{ Id: 1, AppId: "*", FileName: "", RelativeUrl: "/", Title: "All apps allowed", date: new Date().toISOString(), expires: new Date().toISOString() }]);
        return;
      }

      const url = `${window.location.origin}/sites/appcatalog/_api/web/lists/getByTitle('${ALLOWEDAPPSLIST_NAME}')/Items?$top=1000`;
      const allowedAppsListData = await fetchAllAllowedApps(url);
      await addOrUpdateAllowedAppsToCache(allowedAppsListData, 5);
      resolve(allowedAppsListData);
    } catch (err) {
      console.error(SPFxExtensionCore, "Unable to load allowed apps data...", err);
      resolve([]);
    }
  }
);

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
  return allowedList.some((allowedEntry) => {
    const fileIsProvided = !!allowedEntry.FileName;
    const fileIsInWhiteList =
      allowedEntry.FileName &&
      fileNameWithPath
        .toLowerCase()
        .indexOf(allowedEntry.FileName.toLowerCase()) > -1;

    const { webIsProvided, webIsInWhiteList } =
      currentWebInAllowedEntry(allowedEntry);

    if (fileIsProvided && webIsProvided) {
      return fileIsInWhiteList && webIsInWhiteList;
    }
    if (fileIsProvided) {
      return fileIsInWhiteList;
    }
    if (webIsProvided) {
      return webIsInWhiteList;
    }
  });
}

function appIsAllowed(
  appDefinition: SPFxExtensionAppRegistration,
  allowedList: AllowedAppsListData[]
) {
  if (allowedList.some((e) => e.AppId === "*")) {
    return true;
  }
  return allowedList.some((allowedEntry) => {
    const appIsProvided = !!allowedEntry.AppId;
    if (!appIsProvided) {
      return false;
    }

    const appIsInWhiteList =
      allowedEntry.AppId &&
      appDefinition.id.toLowerCase() === allowedEntry.AppId.toLowerCase();

    const { webIsProvided, webIsInWhiteList } =
      currentWebInAllowedEntry(allowedEntry);

    if (webIsProvided) {
      return appIsInWhiteList && webIsInWhiteList;
    }
    return webIsInWhiteList;
  });
}

function currentWebInAllowedEntry(allowedEntry: AllowedAppsListData) {
  const webIsProvided = !!allowedEntry.RelativeUrl;
  let relativeUrl = (allowedEntry.RelativeUrl ?? "").replace(/\/+$/, "");
  const webIsInWhiteList =
    webUrl.toLowerCase().indexOf(relativeUrl.toLowerCase()) > -1;
  return { webIsProvided, webIsInWhiteList };
}

export async function isFileAllowedInCurrentWeb(fileNameWithPath: string) {
  // Service should load blacklist list from whatever source which can be reached by everyone.
  const allowedList = await AllowedAppsListDataPromise;

  if (webUrl === "ERROR") {
    console.warn(ALLOWEDAPPSLIST_ERROR);
    return false;
  }
  if (isInDebug) return true;
  if (!fileIsAllowed(fileNameWithPath, allowedList)) {
    console.warn(
      SPFxExtensionCore,
      "File",
      fileNameWithPath,
      "is not allowed for web",
      webUrl
    );
    return false;
  }
  return true;
}

export async function isAppAllowedInCurrentWeb(
  appDef: SPFxExtensionAppRegistration
) {
  const allowedApps = await AllowedAppsListDataPromise;
  if (isInDebug) return true;
  if (!appIsAllowed(appDef, allowedApps)) {
    console.warn(
      SPFxExtensionCore,
      "App",
      appDef.id,
      "with name",
      appDef.name,
      "is not enabled for web",
      webUrl
    );
    return false;
  }
  return true;
}
