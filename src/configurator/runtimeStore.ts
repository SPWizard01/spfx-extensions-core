import { Signal, signal } from "@preact/signals-react";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import type { SPFxExtensionAppManifest } from "../models/appModel";
import { EMPTY_APP_MANIFEST } from "../utilities/constants";
import type { SelectedAppWebs } from "./models/appCollection";
import { getAllAppCollections, getEnabledAppCollection } from "./services/appCollection";
import { getPnPSPForConfigurationWeb } from "./services/pnpService";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";
import { getAllWebInfos } from "./services/webInfoService";
const queryWeb = getConfiguringWebUrl();


export const configurationWebSP = getPnPSPForConfigurationWeb();
export const configurationWebAppCollection = await getAllAppCollections(configurationWebSP);
export const configurationWebEnabledAppCollections = await getEnabledAppCollection(configurationWebSP);
export const configrationWebUrl = queryWeb ?? getWebAbsoluteUrl();

export const selectedWebAvailableWebs = await getAllWebInfos(configurationWebSP);
export const selectedManifest = signal<SPFxExtensionAppManifest>(EMPTY_APP_MANIFEST);
export const selectedAppWebs = signal<SelectedAppWebs[]>([]);