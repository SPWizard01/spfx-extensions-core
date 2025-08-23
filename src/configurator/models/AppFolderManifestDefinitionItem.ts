import type { SPFxExtensionAppDefinitionConfig } from "../../models/appFolderManifest";

export interface AppFolderManifestDefinitionItem extends SPFxExtensionAppDefinitionConfig {
  name: string;
  isManual: boolean;
  resolved: boolean;
}
