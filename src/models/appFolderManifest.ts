export interface SPFxExtensionAppItemConfig {
  /**
   * If enabled `excludedIds` and `excludedHubIds` will be scanned for exclusion.
   *
   * Else `includedIds` and `includedHubIds` will be scanned for inclusion.
   */
  enabledEverywhere: boolean;
  /**
   * WebId or SiteId of the sp site where the app should be enabled;
   */
  includedIds: string[];
  /**
   * HubId (which is site collection id) of the sp site where the app should be enabled.
   */
  includedHubIds: string[];
  /**
   * WebId or SiteId of the sp site where the app should be disabled;
   */
  excludedIds: string[];
  /**
   * HubId (which is site collection id) of the sp site where the app should be disabled.
   */
  excludedHubIds: string[];
}

export interface SPFxExtensionAppDefinitionConfig {
  /**
   * Id of app definition item, must be unique GUID
   */
  appId: string;
  /**
   * Configuration of said app definition item.
   */
  config: SPFxExtensionAppItemConfig;
}

export interface SPFxExtensionManualAppEntry {
  /**
   * Id of app definition item, must be unique GUID
   */
  appId: string;
  /**
   * Name of the app definition to show in definition grid
   */
  name: string;
  /**
   * Entry point of the app definition item added manually through the UI.
   */
  entryPoint: string;
  /**
   * Will be `true` when added through the UI.
   */
}

export interface SPFxExtensionFolderManifest {
  appDefinitionMap: SPFxExtensionAppDefinitionConfig[];
  /**
   * Files selected as entry points inside manual definitions
   *
   * Need to call `window.__SPFxExtensions.RegisterApp` and/or `window.__SPFxExtensions.InstantiateApp` methods.
   *
   * This ensures proper lifecycle management of your SPFx application.
   *
   * If not called, this will be just a side-effect file that can be executed repeatedly.
   */
  manualEntries: SPFxExtensionManualAppEntry[];
  /**
   * Relative path from manifest to the app entry point i.e. `./app.js` or `./somefolder/app.js?v=hash`
   * It MUST export `SPFxExtensionAppRegistration[]` as default export.
   */
  appRelativeEntryPointUrls: string[];
  cacheString?: string;
  enableCaching?: boolean;
  /**
   * When `true`, entry point and manual entry URLs are loaded through the SharePoint Online
   * public CDN instead of the originating SharePoint host.
   *
   * The resolved URL `https://{host}/{path}` is rewritten to
   * `https://public-cdn.sharepointonline.com/{host}/{path}`, preserving the file name and cache query.
   */
  usePublicCDN?: boolean;
}
