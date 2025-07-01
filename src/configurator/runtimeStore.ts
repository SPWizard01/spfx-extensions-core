import type { IWebInfo } from "@pnp/sp/webs";
import { effect, signal } from "@preact/signals";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import { logGenericCoreDebug } from "../core/services/loggingService";
import type { SPFxExtensionCollectionManifest } from "../models/appCollectionManifest";
import type { SPFxExtensionAppDefinitionMapItem } from "../models/appFolderManifest";
import { EMPTY_APP_MANIFEST, EMPTY_GUID } from "../utilities/constants";
import { cloneObject } from "../utilities/helpers";
import type { ApiCallResult } from "./models/apiCallResult";
import type { AppCollectionConfigurationItem } from "./models/appCollectionConfigurationItem";
import {
  getAllAppCollections,
  getAppCollectionConfig,
} from "./services/appCollection";
import { getPnPSPForConfigurationWeb } from "./services/pnpService";
import { getAllAppItems } from "./services/renderedAppCollection";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";
import { getRootWeb, getSite, getSiteStructure, getWeb } from "./services/webInfoService";
const queryWeb = getConfiguringWebUrl();
export const configrationWebUrl = new URL(queryWeb ? queryWeb : getWebAbsoluteUrl());

export const configurationWebSP = getPnPSPForConfigurationWeb();
export const configurationSite = await getSite(configurationWebSP);
export const configurationRootWeb: ApiCallResult<IWebInfo> = !configurationSite.isError ? await getRootWeb(configurationWebSP) : {
  data: {} as IWebInfo,
  warnings: [],
  error: `Unable to get root web since site is not available`,
  isError: true
};
export const configurationWeb = await getWeb(configurationWebSP);
export const configurationIsGlobal = !queryWeb



export function getConfigurationWebIsRootHub() {
  if (configurationSite.isError || configurationRootWeb.isError || configurationWeb.isError) return false;
  return configurationSite.data.IsHubSite &&
    configurationRootWeb.data.Id === configurationWeb.data.Id;
}

export function getConfigurationWebIsHubChild() {
  if (configurationSite.isError) return false;
  return configurationSite.data.HubSiteId !== EMPTY_GUID;
}

export function getConfigurationWebIsSiteCollection() {
  if (configurationRootWeb.isError || configurationWeb.isError) return false;
  return configurationWeb.data.Id === configurationRootWeb.data.Id;
}

export function getConfigurationWebIsSubsite() {
  if (configurationSite.isError || configurationRootWeb.isError) return true;
  return configurationRootWeb.data.Id !== configurationWeb.data.Id;
}

const allAppCollectionsData = await getAllAppCollections(configurationWebSP);
const enabledAppsData = await getAppCollectionConfig(configurationWebSP);

// export const selectedManifest = signal<SPFxExtensionAppManifest>(EMPTY_APP_MANIFEST);
const allApiAppItems = await getAllAppItems(
  configurationWebSP,
  allAppCollectionsData,
  enabledAppsData.data.enabledAppCollections
);

export const contextCollectionConfig = signal<SPFxExtensionCollectionManifest>(enabledAppsData.data);
export const contextCollectionConfigUpdating = signal<boolean>(false);
export const allAppItems =
  signal<AppCollectionConfigurationItem[]>(allApiAppItems);
export const selectedAppItem = signal<AppCollectionConfigurationItem>();
export const selectedAppDefinitionItem = signal<SPFxExtensionAppDefinitionMapItem>();
export const deletingAppItem = signal<AppCollectionConfigurationItem>();


export const configurationWebSubWebs: IWebInfo[] = [];
export const configurationSiteStructure = await getSiteStructure(configurationWebSP);
effect(() => {
  logGenericCoreDebug("Configuration", selectedAppDefinitionItem.value?.config);
})

export function getEmptyAppItem(appName: string): AppCollectionConfigurationItem {
  return {
    name: appName,
    manifest: EMPTY_APP_MANIFEST,
    activated: false,
  };
}
export function getAppItem(appName: string) {
  return (
    allAppItems.value.find((w) => w.name === appName) ??
    getEmptyAppItem(appName)
  );
}

export function updateApp(updatedApp: AppCollectionConfigurationItem) {
  const apps = cloneObject(allAppItems.value);
  const foundApp = apps.findIndex((w) => w.name === updatedApp.name);
  if (foundApp > -1) {
    apps.splice(foundApp, 1, updatedApp);
  } else {
    apps.push(updatedApp);
  }
  allAppItems.value = apps;
}

export function updateSelectedApp(
  updatedApp: AppCollectionConfigurationItem,
  withAppUpdate = false
) {
  const newApp = cloneObject(updatedApp);
  selectedAppItem.value = newApp;
  if (withAppUpdate) {
    updateApp(newApp);
  }
}

// export const allAppItems = computed<AppsItem[]>(() => {
//     return allAppCollections.value.map<AppsItem>((app) => ({
//         name: app,
//         manifest: EMPTY_APP_MANIFEST,
//         enabled: enabledAppCollections.value.includes(app),
//         isInDebug: () => {
//             return isAppInDebug(app);
//         },
//     }))
// });
