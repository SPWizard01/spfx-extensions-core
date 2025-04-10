import type { SPFxExtensionCollectionManifest } from "./appCollectionManifest";
import type { SPFxExtensionFolderManifest } from "./appFolderManifest";

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

export interface CacheableAppFolderManifest extends ManifestBase {
  manifest: SPFxExtensionFolderManifest;
}

export interface CacheableAppCollectionManifest extends ManifestBase {
  manifest: SPFxExtensionCollectionManifest;
}


export type AppFolderManifestCacheItem = CacheItemBase & CacheableAppFolderManifest;
export type AppCollectionManifestCacheItem = CacheItemBase &
  CacheableAppCollectionManifest;