export interface SPFxExtensionApp {
    js: string[];
    css?: string[];
    //potentially other keys that we could handle i.e. fonts etc
}

export interface SPFxExtensionAppMap {
    /**
     * WebId of the site where the app is enabled or `*` for all sites
     */
    webId: string;
    /**
     * AppIds of the apps that are enabled on the `webId` or `*` for all apps
     */
    enabledAppIds: string[];
}

export interface SPFxExtensionAppManifest {
    /**
     * Relative path from manifest to the app entry point i.e. `./app.js` or `./somefolder/app.js?v=hash`
     */
    appRelativeEntryPointUrls: string[];
    enabledApps: SPFxExtensionAppMap[];
    /**
     * Only relevant if current site is a root hub site, disregards `enabledApps` property if enabled
     */
    enabledOnAllHubSites: boolean;
    /**
     * If set to false, the app will not be loaded by the core
     */
    enabled: boolean;
    /**
     * If set to false, the app will not be loaded as ESM module meaning that app owner is responsible for loading the app by calling `window.__SPFxExtensions.RegisterApp` and/or `window.__SPFxExtensions.LoadApp` methods.
     * 
     * If set to true, the app will be loaded as ESM module and the app owner is responsible for providing a default export in the entry point as `SPFxExtensionAppRegistration[]`.
     */
    isESM: boolean;
    enableCaching?: boolean;
    /**
     * Minutes to cache every entry point
     */
    cacheDuration?: number;
}
