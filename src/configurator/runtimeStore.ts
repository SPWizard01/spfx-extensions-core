import { computed, signal } from "@preact/signals-react";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import type { SPFxExtensionAppManifest } from "../models/appModel";
import { EMPTY_APP_MANIFEST } from "../utilities/constants";
import { DEBUG_KEYS } from "../utilities/debug";
import type { SelectedAppWebs } from "./models/appCollection";
import type { AppsItem } from "./models/appsItem";
import { getAllAppCollections, getEnabledAppCollection } from "./services/appCollection";
import { getPnPSPForConfigurationWeb } from "./services/pnpService";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";
import { getAllWebInfos } from "./services/webInfoService";
const queryWeb = getConfiguringWebUrl();


export const configurationWebSP = getPnPSPForConfigurationWeb();
const allAppCollectionsData = await getAllAppCollections(configurationWebSP);
const enabledAppsData = await getEnabledAppCollection(configurationWebSP);
export const configrationWebUrl = queryWeb ?? getWebAbsoluteUrl();

export const selectedWebAvailableWebs = await getAllWebInfos(configurationWebSP);


export const allAppCollections = signal<string[]>(allAppCollectionsData);
export const enabledAppCollections = signal<string[]>(enabledAppsData.data);
export const selectedManifest = signal<SPFxExtensionAppManifest>(EMPTY_APP_MANIFEST);
export const selectedAppWebs = signal<SelectedAppWebs[]>([]);
export const allAppItems = computed<AppsItem[]>(() => {
    return allAppCollections.value.map<AppsItem>((app) => ({
        name: app,
        enabled: enabledAppCollections.value.includes(app),
        isInDebug: () => {
            return Number(localStorage.getItem(`${DEBUG_KEYS.SPFXEXT}${app}`)) > 0;
        },
    }))
});