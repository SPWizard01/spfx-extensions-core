import type { SPFxExtensionFolderManifest } from "../../models/appFolderManifest";

export function fixupManifest(manifest: SPFxExtensionFolderManifest) {
  if (!manifest.appDefinitionMap) {
    manifest.appDefinitionMap = [];
  }
  if (!manifest.appRelativeEntryPointUrls) {
    manifest.appRelativeEntryPointUrls = [];
  }
  if (!manifest.manualDefinitions) {
    manifest.manualDefinitions = [];
  }
  return manifest;
}
