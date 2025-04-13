import { signal } from "@preact/signals";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import type { SPFxExtensionCollectionManifest, SPFxExtensionUrlMapItem } from "../models/appCollectionManifest";
import { EMPTY_APP_MANIFEST, EMPTY_GUID } from "../utilities/constants";
import type { AppCollectionConfigurationItem } from "./models/appCollectionConfigurationItem";
import {
  getAllAppCollections,
  getAppCollectionManifest,
} from "./services/appCollection";
import { getPnPSPForConfigurationWeb } from "./services/pnpService";
import { getAllAppItems } from "./services/renderedAppCollection";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";
import { getAllWebInfos, getSite, getWeb, getWebRoot } from "./services/webInfoService";
const queryWeb = getConfiguringWebUrl();
export const configrationWebUrl = new URL(queryWeb ?? getWebAbsoluteUrl());

export const configurationWebSP = getPnPSPForConfigurationWeb();
export const configurationSite = await getSite(configurationWebSP);
export const configurationWeb = await getWeb(configurationWebSP);
export const configurationRootWeb = await getWebRoot(configurationWebSP);
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

export function getConfigurationWebIsSubsite() {
  if (configurationWeb.isError || configurationRootWeb.isError) return true;
  return configurationRootWeb.data.Id !== configurationWeb.data.Id;
}

export const configurationWebSubWebs = await getAllWebInfos(
  configurationWebSP
);

export const configurationWebStructure: SPFxExtensionUrlMapItem[] = configurationWebSubWebs.map((w) => {
  return {
    id: w.Id,
    siteId: configurationSite.data.Id,
    url: w.Url,
    isRootWeb: configurationRootWeb.data.Id === w.Id,
  }
});


const allAppCollectionsData = await getAllAppCollections(configurationWebSP);
const enabledAppsData = await getAppCollectionManifest(configurationWebSP);

// export const selectedManifest = signal<SPFxExtensionAppManifest>(EMPTY_APP_MANIFEST);
const allApiAppItems = await getAllAppItems(
  configurationWebSP,
  allAppCollectionsData,
  enabledAppsData.data.enabledAppCollections
);

export const contextCollectionConfig = signal<SPFxExtensionCollectionManifest>(enabledAppsData.data);
export const allAppItems =
  signal<AppCollectionConfigurationItem[]>(allApiAppItems);
export const selectedAppItem = signal<AppCollectionConfigurationItem>();
export const deletingAppItem = signal<AppCollectionConfigurationItem>();
export const appCollectionUpdating = signal<boolean>(false);


export function getEmptyAppItem(appName: string) {
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
  const apps = JSON.parse(
    JSON.stringify(allAppItems.value)
  ) as AppCollectionConfigurationItem[];
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
  const newApp = JSON.parse(JSON.stringify(updatedApp));
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
