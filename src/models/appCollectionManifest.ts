export interface SPFxExtensionApp {
    js: string[];
    css?: string[];
    //potentially other keys that we could handle i.e. fonts etc
}

export interface SPFxExtensionAppMapItemConfig {
    /**
     * WebId of the site where the app is enabled or `*` for all sites
     */
    webIds: string[];
    /**
     * If enabled webIds has no effect, same as webIds would have been set to `*`, also applicable to hub child sites
     * @default false
     */
    enabledOnChildren: boolean;
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

    /**
     * If set to false, the app will not be loaded as ESM module meaning that app owner is responsible for loading the app by calling `window.__SPFxExtensions.RegisterApp` and/or `window.__SPFxExtensions.LoadApp` methods.
     * 
     * If set to true, the app will be loaded as ESM module and the app owner is responsible for providing a default export in the entry point as `SPFxExtensionAppRegistration[]`.
     */
    isESM: boolean;
    cacheString?: string;
    enableCaching?: boolean;
}
