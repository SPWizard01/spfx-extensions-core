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
  placeHolderResolved: boolean;
  /**
   * Promise that loads apps.txt from root, site and web location.
   */
  spAppInitializationPromise: Promise<void>;
  spAppInitializationPromiseResolver(): void;
  /**
   * All application manifest.txt collected from root, site, and web apps.txt
   */
  appManifestPromises: Promise<any>[];
  fluentIconsInitialized: boolean;
  ConfiguratorUrl: string;
}
