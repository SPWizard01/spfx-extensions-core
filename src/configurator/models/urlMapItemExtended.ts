import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";

export interface ConfiguratorURLMapItem extends SPFxExtensionUrlMapItem {
    canDelete: boolean;
}