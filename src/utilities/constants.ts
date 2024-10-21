import { DEBUG_KEYS } from "./debug";

export const APP_CATALOG = "/sites/appcatalog";
export const CDN_LOCATION = "CDN";
export const ROOT_CDN_LOCATION = (window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "RootCDNLocation")?.Data ?? `${APP_CATALOG}/${CDN_LOCATION}`).toLowerCase();
export const EXTENSION_APPS_FOLDER = window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "ExtensionFolderName")?.Data ?? "SPFxExtensions";
export const WELL_KNOWN_MANIFEST_LOCATION = `/${EXTENSION_APPS_FOLDER}/`;
export const BLACKLIST_NAME = "SPFxExtensionsBlackList";
export const ALLOWEDAPPSLIST_NAME = window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "AppWhiteListName")?.Data ?? "SPFxExtensionsWhiteList";
export const MANIFEST_NAME = "manifest.txt";
export const APPCOLLECTION_MANIFEST_NAME = "apps.txt";
export const APP_LOADING = "Loading...";
export const CONFIGURATION_LIST_NAME = "SPFxExtensionsConfiguration";

export const BLACKLIST_CACHE_KEY =
  `${DEBUG_KEYS.SPFXEXT}${BLACKLIST_NAME}` as const;

export const ALLOWEDAPPS_CACHE_KEY =
  `${DEBUG_KEYS.SPFXEXT}${ALLOWEDAPPSLIST_NAME}` as const;
/**
 * Points to root sharepoint location into app catalog
 * OnPrem/SPO: ```/sites/appcatalog/CDN/SPFxExtensionApps/```
 */
export const ROOT_APPS_LOCATION = `${ROOT_CDN_LOCATION}${WELL_KNOWN_MANIFEST_LOCATION}`;

/**
 * Points to root sharepoint manifest location
 * OnPrem/SPO: ```/sites/appcatalog/CDN/SPFxExtensionApps/apps.txt```
 */
export const ROOT_APPS_MANIFEST_LOCATION = `${ROOT_APPS_LOCATION}${APPCOLLECTION_MANIFEST_NAME}`;

export const IS_WORKBENCH =
  window.location.host.toLowerCase().indexOf("/_layouts/15/workbench.aspx") >
  -1;

export const IS_MODERN_EXPIRIENCE = !!!window._spBodyOnLoadFunctions;

export const SPFxExtensionCore = "[SPFxExtensionCore]" as const;

export const APPBLACKLIST_ERROR =
  `${SPFxExtensionCore} Blacklist service error while retrieving site context, does AppBlacklist list exist?` as const;
export const ALLOWEDAPPSLIST_ERROR =
  `${SPFxExtensionCore} Allowed Apps: Error while retrieving site context, does AllowedApps list exist?` as const;
export const APPBLACKLIST_ERROR_NO_URL =
  `${SPFxExtensionCore} Blacklist service while retrieving site context, could not find Web URL inside context` as const;
export const ALLOWEDAPPSLIST_ERROR_NO_URL =
  `${SPFxExtensionCore} Allowed Apps: Could not find Web URL inside context` as const;
