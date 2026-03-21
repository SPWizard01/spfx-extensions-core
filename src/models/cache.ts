import type { SPFxExtensionCollectionManifest } from "./appCollectionManifest";
import type { SPFxExtensionFolderManifest } from "./appFolderManifest";

export type ManifestLocation = "root" | "hub" | "site" | "web";
export interface ManifestBase {
  name: string;
  url: string;
  type: ManifestLocation;
  hash: string;
}
export interface CacheItemBase {
  expires: string;
}

export interface CacheableAppFolderManifest extends ManifestBase {
  manifest: SPFxExtensionFolderManifest;
  lastCheck: string;
}

export interface CacheableAppCollectionManifest extends ManifestBase {
  manifest: SPFxExtensionCollectionManifest;
  lastCheck: string;
}

export type AppFolderManifestCacheItem = CacheItemBase & CacheableAppFolderManifest;
export type AppCollectionManifestCacheItem = CacheItemBase & CacheableAppCollectionManifest;
