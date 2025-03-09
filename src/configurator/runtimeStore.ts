import { signal } from "@preact/signals-react";
import { EMPTY_GUID, getWebAbsoluteUrl } from "../core/services/contextService";
import { EMPTY_APP_MANIFEST } from "../utilities/constants";
import type { AppCollectionConfigurationItem } from "./models/appCollectionConfigurationItem";
import { getAllAppCollections, getEnabledAppCollection } from "./services/appCollection";
import { getPnPSPForConfigurationWeb } from "./services/pnpService";
import { getAllAppItems } from "./services/renderedAppCollection";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";
import { getAllWebInfos } from "./services/webInfoService";
const queryWeb = getConfiguringWebUrl();


export const configurationWebSP = getPnPSPForConfigurationWeb();
export const configurationSiteInfo = await configurationWebSP.site()
export const configurationWebInfo = await configurationWebSP.web();
export const configurationSiteRootWeb = await configurationWebSP.site.rootWeb();
export const configurationWebIsRootHub = configurationSiteInfo.IsHubSite && configurationSiteRootWeb.Id === configurationWebInfo.Id;
export const configurationWebBelongsToHub = !configurationSiteInfo.IsHubSite && configurationSiteInfo.HubSiteId !== EMPTY_GUID


export const configrationWebUrl = queryWeb ?? getWebAbsoluteUrl();
export const selectedWebAvailableWebs = await getAllWebInfos(configurationWebSP);
console.log(configurationWebInfo, configurationSiteRootWeb, configurationSiteInfo);
const allAppCollectionsData = await getAllAppCollections(configurationWebSP);
const enabledAppsData = await getEnabledAppCollection(configurationWebSP);

// export const selectedManifest = signal<SPFxExtensionAppManifest>(EMPTY_APP_MANIFEST);
const allApiAppItems = await getAllAppItems(configurationWebSP, allAppCollectionsData, enabledAppsData.data);
export const allAppItems = signal<AppCollectionConfigurationItem[]>(allApiAppItems);
export const selectedAppItem = signal<AppCollectionConfigurationItem>();
export const deletingAppItem = signal<AppCollectionConfigurationItem>();

export function getEmptyAppItem(appName: string) {
    return {
        name: appName,
        manifest: EMPTY_APP_MANIFEST,
        activated: false
    }
}
export function getAppItem(appName: string) {
    return allAppItems.value.find((w) => w.name === appName) ?? getEmptyAppItem(appName);
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

export function updateSelectedApp(updatedApp: AppCollectionConfigurationItem, withAppUpdate = false) {
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