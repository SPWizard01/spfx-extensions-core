import type { SPFxExtensionAppManifest } from "../../models/appCollectionManifest";

export interface SelectedAppWebs {
    appCollectionName: string;
    manifest: SPFxExtensionAppManifest;
}