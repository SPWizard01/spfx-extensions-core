export interface SPFxExtensionApp {
    js: string[];
    css?: string[];
    //potentially other keys that we could handle i.e. fonts etc
}

export interface SPFxExtensionUrlMapItem {
    /**
     * Id of site/web/hub
     */
    id: string;
    /**
     * Url of the site/web/hub to display in the UI instead of the id.
     */
    url: string;
}

export interface SPFxExtensionAppMapItemConfig {
    /**
     * WebId or siteid or hubid of the sp site where the app should be enabled;
     */
    includedIds: string[];
    /**
     * WebId or siteid or hubid of the sp site where the app should be disabled.
     * 
     * Takes precendence over `includedIds`.
     * 
     * If the app is enabled on a site and disabled on the same site, it will be disabled.
     */
    excludedIds: string[];
    /**
     * A subset of `includedIds` that will be used to determine if the app should be enabled on all hub children.
     * 
     * Only applicable to `includedIds` that refer to a hub root.
     * 
     * This implies that the `includedIds` item is treated as hub root instead of site collection.
     */
    hubObjectIds: string[];
    /**
     * If enabled takes precedence over `includedIds` and `hubObjectIds`
     * 
     * `excludedIds` will still take precedence over this flag.
     */
    enabledEverywhere: boolean;
}

export interface SPFxExtensionAppMap {
    /**
     * Id of app definition item.
     */
    appId: string;
    /**
     * Configuration of said app definition item.
     */
    config: SPFxExtensionAppMapItemConfig;
}

export interface SPFxExtensionAppManifest {
    /**
     * Relative path from manifest to the app entry point i.e. `./app.js` or `./somefolder/app.js?v=hash`
     */
    appRelativeEntryPointUrls: string[];
    appDefinitionMap: SPFxExtensionAppMap[];
    urlMap?: SPFxExtensionUrlMapItem[]; 
    /**
     * If set to false, the app will not be loaded as ESM module meaning that app owner is responsible for loading the app by calling `window.__SPFxExtensions.RegisterApp` and/or `window.__SPFxExtensions.LoadApp` methods.
     * 
     * If set to true, the app will be loaded as ESM module and the app owner is responsible for providing a default export in the entry point as `SPFxExtensionAppRegistration[]`.
     */
    isESM: boolean;
    cacheString?: string;
    enableCaching?: boolean;
}
