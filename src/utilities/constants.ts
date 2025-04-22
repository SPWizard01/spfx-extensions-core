import type { SPFxExtensionCollectionManifest } from "../models/appCollectionManifest";
import type {
  SPFxExtensionAppMapItemConfig,
  SPFxExtensionFolderManifest,
} from "../models/appFolderManifest";

/**
 * Found in `SpfxExtensionloaderWebpart.manifest.json`
 */
export const SPFX_WEBPART_ID = "d6ca1fc2-0591-4c6d-8a25-cae3262c017b";
export const CONFIGURATOR_APP_ID = "45e75137-13c5-4bb2-a2b3-8ab6382682ee";
export const CONFIGURATOR_PAGE_NAME = "SPFxExtensionsConfigurator";
export const CONFIGURATOR_PAGE_URL = `SitePages/${CONFIGURATOR_PAGE_NAME}.aspx`;
export const MANIFEST_NAME = "manifest.txt";
export const APPCOLLECTION_MANIFEST_NAME = "collectionconfig.txt";
export const APP_LOADING = "Loading...";
export const CONFIGURATION_LIST_NAME = "SPFxExtensionsConfiguration";
export const ALLOWEDAPPSLIST_NAME = "SPFxExtensionsWhiteList";
export const SPFX_EXTENSIONS_FOLDER = "SPFxExtensions";
export const WELL_KNOWN_MANIFEST_LOCATION = `/${SPFX_EXTENSIONS_FOLDER}/`;
export const SPFX_EXTENSIONS_DATA_SITE = "SPFxExtensionsData";
export const SPFxExtensionCore = "[SPFxExtensionCore]" as const;
export const EMPTY_APP_MANIFEST: SPFxExtensionFolderManifest = {
  appDefinitionMap: [],
  appRelativeEntryPointUrls: [],
  isESM: true,
};
export const EMPTY_APP_DEF_ITEM_CONFIG: SPFxExtensionAppMapItemConfig = {
  enabledEverywhere: false,
  excludedHubIds: [],
  excludedIds: [],
  includedHubIds: [],
  includedIds: [],
};
export const EMPTY_COLLECTION_MANIFEST: SPFxExtensionCollectionManifest = {
  enabledAppCollections: [],
  urlMap: [],
};
export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
