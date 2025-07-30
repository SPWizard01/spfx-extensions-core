import type { CacheableAppFolderManifest } from "./cache";
import type { CompatibleEnvironmentType } from "./environment";

export interface SPFxExtensionUtilsPlaceHolderProvider {
  /**
   * PlaceholderProvider instance from SPFx
   */
  placeHolderProvider: any;
  /**
   * ISPEventObserver instance from SPFx
   */
  eventObserver: any;
}

export interface SPFxExtensionAppUtils {
  environmentType: CompatibleEnvironmentType;
  initializedThroughSPFX: boolean;

  placeHolderProviderPromise: Promise<SPFxExtensionUtilsPlaceHolderProvider>;
  placeHolderResolver: (plc: SPFxExtensionUtilsPlaceHolderProvider) => void;
  /**
   * Promise that loads collectionConfig.txt from root, site and web location.
   * 
   * Used by SPFx webpart `renderEditMode` to track assets that are in progress of loading
   * 
   */
  spAppInitializationPromise: Promise<void>;
  spAppInitializationPromiseResolver(): void;
  /**
   * All application manifest.txt collected from root, site, web, hub
   * 
   * Used by SPFx webpart `renderEditMode` to track assets that are in progress of loading
   */
  appManifestPromises: Promise<CacheableAppFolderManifest>[];
  fluentIconsInitialized: boolean;
  /**
   * Url to the configurator page.
   * 
   * Defaults to `{APP_CATALOG_URL}/SPFxExtensionsData/SitePages/SPFxExtensionsConfigurator.aspx`
   */
  ConfiguratorPageUrl: string;
}
