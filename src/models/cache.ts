import type { SPFxExtensionAppManifest } from "./appModel";

export type ManifestLocation = "root" | "site" | "web";
export interface ManifestBase {
  url: string;
  type: ManifestLocation;
  hash: string;
  isAppCollection: boolean;
  isHubFetch?: boolean;
}
export interface CacheItemBase {
  date: string;
  // domain: string;
  expires: string;
}

export interface AppFolderManifest extends ManifestBase {
  isAppCollection: false;
  appManifest: SPFxExtensionAppManifest;
}

export interface AppCollectionManifest extends ManifestBase {
  isAppCollection: true;
  appCollection: string[];
}

export type ManifestItem = AppFolderManifest | AppCollectionManifest;

export type AppFolderManifestCacheItem = CacheItemBase & AppFolderManifest;
export type AppCollectionManifestCacheItem = CacheItemBase &
  AppCollectionManifest;

export type ManifestCacheItem = CacheItemBase & ManifestItem;
