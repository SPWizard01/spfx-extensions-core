import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import type { HubUrlCollectionItem, SiteUrlCollectionItem } from "./UrlCollectionMapItem";


interface WebDataDelete {
    itemType: "web",
    item: SPFxExtensionUrlMapItem,
    controlType: "delete",
}
interface WebDataSwitch {
    itemType: "web",
    item: SPFxExtensionUrlMapItem,
    controlType: "switch",
    data: boolean,
}

interface SiteDataDelete {
    itemType: "site",
    item: SiteUrlCollectionItem,
    controlType: "delete",
}
interface SiteDataSwitch {
    itemType: "site",
    item: SiteUrlCollectionItem,
    controlType: "switch",
    data: boolean,
}

interface HubDataDelete {
    itemType: "hub",
    item: HubUrlCollectionItem,
    controlType: "delete",
}

interface HubDataSwitch {
    itemType: "hub",
    item: HubUrlCollectionItem,
    controlType: "switch",
    data: boolean,
}

export type CollectionEventWebData = WebDataDelete | WebDataSwitch;
export type CollectionEventSiteData = SiteDataDelete | SiteDataSwitch | CollectionEventWebData;
export type CollectionEventHubData = HubDataDelete | HubDataSwitch | CollectionEventSiteData;