import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import type { HubUrlCollectionItem, SiteUrlCollectionItem } from "./StructureModels";


interface WebDataDelete {
    itemType: "web",
    item: SPFxExtensionUrlMapItem,
}


interface SiteDataDelete {
    itemType: "site",
    item: SiteUrlCollectionItem,
}


interface HubDataDelete {
    itemType: "hub",
    item: HubUrlCollectionItem,
}

export type CollectionEventWebData = WebDataDelete;
export type CollectionEventSiteData = SiteDataDelete | WebDataDelete;
export type CollectionEventHubData = HubDataDelete | CollectionEventSiteData;