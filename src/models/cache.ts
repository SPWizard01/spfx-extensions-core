import type { SPFxExtensionAppManifest } from "./appCollectionManifest";

export type ManifestLocation = "root" | "site" | "web";
interface ManifestBase {
  name: string;
  url: string;
  type: ManifestLocation;
  hash: string;
  isHubFetch?: boolean;
}
export interface CacheItemBase {
  date: string;
  // domain: string;
  expires: string;
}

export interface AppFolderManifest extends ManifestBase {
  appManifest: SPFxExtensionAppManifest;
}

export interface AppCollectionManifest extends ManifestBase {
  appCollection: string[];
}


export type AppFolderManifestCacheItem = CacheItemBase & AppFolderManifest;
export type AppCollectionManifestCacheItem = CacheItemBase &
  AppCollectionManifest;