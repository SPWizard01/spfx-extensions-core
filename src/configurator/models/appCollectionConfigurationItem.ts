import type { SPFxExtensionFolderManifest } from "../../models/appFolderManifest";

export interface AppCollectionConfigurationItem {
  name: string;
  activated: boolean;
  manifest: SPFxExtensionFolderManifest;
}