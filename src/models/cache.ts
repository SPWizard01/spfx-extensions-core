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


export interface PNPValue<T = any> {
  keyHash: string;
  url: string;
  data: T;
}
export type PNPCacheItem<T = any> = CacheItemBase & PNPValue<T>;