export interface SPFxExtensionAppMapItemConfig {
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

export interface SPFxExtensionAppDefinitionMapItem {
    /**
     * Id of app definition item.
     */
    appId: string;
    /**
     * Only applicable to non ESM
     */
    appName?: string;
    /**
     * Only applicable to non ESM
     */
    appRelativeEntryPointUrl?: string;
    /**
     * Configuration of said app definition item.
     */
    config: SPFxExtensionAppMapItemConfig;
}

export interface SPFxExtensionFolderManifest {
    /**
     * Relative path from manifest to the app entry point i.e. `./app.js` or `./somefolder/app.js?v=hash`
     */
    appRelativeEntryPointUrls: string[];
    appDefinitionMap: SPFxExtensionAppDefinitionMapItem[];
    /**
     * If set to false, the app will not be loaded as ESM module.
     * 
     * This means that app owner is responsible for loading the app by calling `window.__SPFxExtensions.RegisterApp` and/or `window.__SPFxExtensions.InstantiateApp` methods.
     * 
     * If set to true, the app will be loaded as ESM module and the app owner is responsible for providing a default export in the entry point as `SPFxExtensionAppRegistration[]`.
     */
    isESM: boolean;
    cacheString?: string;
    enableCaching?: boolean;
}
