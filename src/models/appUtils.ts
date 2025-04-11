import type { CompatibleDisplayMode, CompatibleEnvironmentType } from "./environment";

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
  initedThroughModern: boolean;
  /**
   * Will update when display mode changes in modern pages
   */
  displayMode: CompatibleDisplayMode;

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
  appManifestPromises: Promise<any>[];
  fluentIconsInitialized: boolean;
  ConfiguratorUrl: string;
}
