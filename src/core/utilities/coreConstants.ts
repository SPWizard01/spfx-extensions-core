import { SPFxExtensionCore } from "../../utilities/constants";

export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
export const CONFIGURATOR_APP_ID = "45e75137-13c5-4bb2-a2b3-8ab6382682ee";
export const CONFIGURATOR_APP_INSTANCEID = "f3ab710f-2c08-422e-a7ad-5d93eb51e7a3";
export const CORE_APP_ID = "3be36e80-4431-4b52-99c5-0a339b4e696e";
export const EXTENSION_APPS_FOLDER = window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "ExtensionFolderName")?.Data ?? "SPFxExtensions";
export const WELL_KNOWN_MANIFEST_LOCATION = `/${EXTENSION_APPS_FOLDER}/`;
export const BLACKLIST_NAME = "SPFxExtensionsBlackList";
export const ALLOWEDAPPSLIST_NAME = window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "AppWhiteListName")?.Data ?? "SPFxExtensionsWhiteList";
export const MANIFEST_NAME = "manifest.txt";
export const APPCOLLECTION_MANIFEST_NAME = "apps.txt";
export const APP_LOADING = "Loading...";
export const CONFIGURATION_LIST_NAME = "SPFxExtensionsConfiguration";


export const APP_CATALOG = window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "AppCatalogUrl")?.Data ?? "/sites/appcatalog";
export const CDN_LOCATION = "CDN";
export const ROOT_CDN_LOCATION = (window.__SPFxExtensions.__CoreConfig.find(c => c.Title === "RootCDNLocation")?.Data ?? `${APP_CATALOG}/${CDN_LOCATION}`).toLowerCase();
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

export const APPBLACKLIST_ERROR =
    `${SPFxExtensionCore} Blacklist service error while retrieving site context, does AppBlacklist list exist?` as const;
export const ALLOWEDAPPSLIST_ERROR =
    `${SPFxExtensionCore} Allowed Apps: Error while retrieving site context, does AllowedApps list exist?` as const;
export const APPBLACKLIST_ERROR_NO_URL =
    `${SPFxExtensionCore} Blacklist service while retrieving site context, could not find Web URL inside context` as const;
export const ALLOWEDAPPSLIST_ERROR_NO_URL =
    `${SPFxExtensionCore} Allowed Apps: Could not find Web URL inside context` as const;