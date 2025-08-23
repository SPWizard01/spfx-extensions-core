import type { SPFxExtensionAppDefinitionMapItem } from "../../models/appFolderManifest";

export interface AppFolderManifestDefinitionItem extends SPFxExtensionAppDefinitionMapItem {
  name: string;
  isManual: boolean;
  resolved: boolean;
}
