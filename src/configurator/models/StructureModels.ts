import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";

export interface SiteUrlCollectionItem extends SPFxExtensionUrlMapItem {
  webs: SPFxExtensionUrlMapItem[];
}
export interface HubUrlCollectionItem extends SPFxExtensionUrlMapItem {
  sites: SiteUrlCollectionItem[];
  webs: SPFxExtensionUrlMapItem[];
}

export interface GlobalUrlStructure {
  hubs: HubUrlCollectionItem[];
  sites: SiteUrlCollectionItem[];
  webs: SPFxExtensionUrlMapItem[];
}
