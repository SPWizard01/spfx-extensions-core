
export const CONFIGURATOR_APP_ID = "45e75137-13c5-4bb2-a2b3-8ab6382682ee";
export const CONFIGURATOR_APP_INSTANCEID = "f3ab710f-2c08-422e-a7ad-5d93eb51e7a3";
export const CONFIGURATOR_PAGE_NAME = "SPFxExtensionsConfigurator";
export const CONFIGURATOR_PAGE_URL = `SitePages/${CONFIGURATOR_PAGE_NAME}.aspx`;
export const CORE_APP_ID = "3be36e80-4431-4b52-99c5-0a339b4e696e";
export const BLACKLIST_NAME = "SPFxExtensionsBlackList";
export const MANIFEST_NAME = "manifest.txt";
export const APPCOLLECTION_MANIFEST_NAME = "apps.txt";
export const APP_LOADING = "Loading...";
export const CONFIGURATION_LIST_NAME = "SPFxExtensionsConfiguration";
export const ALLOWEDAPPSLIST_NAME = "SPFxExtensionsWhiteList";
export const EXTENSION_APPS_FOLDER = "SPFxExtensions";
export const WELL_KNOWN_MANIFEST_LOCATION = `/${EXTENSION_APPS_FOLDER}/`;

export const IS_WORKBENCH =
  window.location.host.toLowerCase().indexOf("/_layouts/15/workbench.aspx") >
  -1;
export const SPFX_EXTENSIONS_DATA_SITE = "SPFxExtensionsData";
export const IS_MODERN_EXPIRIENCE = !!!window._spBodyOnLoadFunctions;
export const SPFxExtensionCore = "[SPFxExtensionCore]" as const;
export const IS_SPO = window.location.host.includes(".sharepoint.com");




export const APPBLACKLIST_ERROR =
    `${SPFxExtensionCore} Blacklist service error while retrieving site context, does AppBlacklist list exist?` as const;
export const ALLOWEDAPPSLIST_ERROR =
    `${SPFxExtensionCore} Allowed Apps: Error while retrieving site context, does AllowedApps list exist?` as const;
export const APPBLACKLIST_ERROR_NO_URL =
    `${SPFxExtensionCore} Blacklist service while retrieving site context, could not find Web URL inside context` as const;
export const ALLOWEDAPPSLIST_ERROR_NO_URL =
    `${SPFxExtensionCore} Allowed Apps: Could not find Web URL inside context` as const;