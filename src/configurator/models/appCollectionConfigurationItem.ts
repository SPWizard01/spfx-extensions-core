import type { SPFxExtensionAppManifest } from "../../models/appCollectionManifest";

export interface AppCollectionConfigurationItem {
  name: string;
  activated: boolean;
  manifest: SPFxExtensionAppManifest;
}