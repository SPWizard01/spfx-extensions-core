export interface SPFxExtensionUrlMapItem {
    /**
     * Id of site/web/hub
     */
    id: string;
    siteId: string;
    /**
     * Url of the site/web/hub to display in the UI instead of the id.
     */
    url: string;
    type: "site" | "web";
}

export interface SPFxExtensionCollectionManifest {
    enabledAppCollections: string[];
    urlMap: SPFxExtensionUrlMapItem[];
}