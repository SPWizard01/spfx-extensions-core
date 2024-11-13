import { type DBSchema, openDB, deleteDB } from "idb";
import type {
  AppCollectionManifestCacheItem,
  AppFolderManifestCacheItem,
  CacheItemBase,
} from "../models/cache";
import type { AllowedAppsListData } from "../models/allowedAppsListData";
import { DEBUG_KEYS } from "../utilities/debug";
import { SPFxExtensionCore } from "../utilities/constants";
import type { HubData } from "../models/hubData";
import type { ConfigurationListData } from "../models/configurationList";

interface SPFxExtensionSchema {
  AppFolderManifestCache: {
    key: string;
    value: AppFolderManifestCacheItem;
  };
  AppCollectionManifestCache: {
    key: string;
    value: AppCollectionManifestCacheItem;
  };
  AllowedApps: {
    key: number;
    value: AllowedAppsListData;
  };
  HubSiteData: {
    key: string;
    value: HubData;
  };
  SPFxExtensionConfig: {
    key: string;
    value: CacheItemBase & { Title: string, [key: string]: any };
  };
}

export interface SPFxExtensionsCoreDB extends DBSchema, SPFxExtensionSchema {

}

type StoreKeys = keyof SPFxExtensionSchema;
type Stores = { [key in StoreKeys]: key };

export const StoreNames: Stores = {
  AppFolderManifestCache: "AppFolderManifestCache",
  AppCollectionManifestCache: "AppCollectionManifestCache",
  AllowedApps: "AllowedApps",
  HubSiteData: "HubSiteData",
  SPFxExtensionConfig: "SPFxExtensionConfig",
} as const;

// const AppFolderManifestCache = "AppFolderManifestCache";
// const AppCollectionManifestCache = "AppCollectionManifestCache";
// const AllowedApps = "AllowedApps";
// const HubSiteData = "HubSiteData";
// const SPFxExtensionConfig = "SPFxExtensionConfig";

const DBNAME = `${DEBUG_KEYS.SPFXEXT}COREDB`;
const openDBPromise = openDB<SPFxExtensionsCoreDB>(DBNAME, 1, {
  blocking(_currentVersion, _blockedVersion, _event) {
    spfxExtensionsCoreDB.close();
    alert("A new version of this page is ready. Please reload the page.");
  },
  async upgrade(database, oldVersion, newVersion, transaction, event) {
    /// Create the object store
    if (oldVersion === 0) {
      database.createObjectStore(StoreNames.AppFolderManifestCache, { keyPath: "url" });
      database.createObjectStore(StoreNames.AppCollectionManifestCache, {
        keyPath: "url",
      });
      database.createObjectStore(StoreNames.AllowedApps, { keyPath: "Id" });
      database.createObjectStore(StoreNames.HubSiteData, { keyPath: "SiteId" });
      database.createObjectStore(StoreNames.SPFxExtensionConfig, { keyPath: "Title" });
    }
    //diff between 0 and 1 just delete the old database and let it be repopulated
    // if (oldVersion === 1) {
    //   database.createObjectStore(AllowedApps, { keyPath: "Id" });
    // }
  },
});
openDBPromise.catch((err) => {
  console.error(
    "Error opening database for Core, please contact your administrator."
  );
  deleteDB(DBNAME).then(() => {
    window.location.reload();
  });
  throw err;
});

export const spfxExtensionsCoreDB = await openDBPromise;

export function getCacheItemBase(cacheTimeMinutes: number) {
  const dateNow = new Date();
  const date = dateNow.toISOString();
  dateNow.setMinutes(dateNow.getMinutes() + cacheTimeMinutes);
  const expires = dateNow.toISOString();
  return {
    date,
    // domain: window.location.host,
    expires,
  };
}

export async function evictItemsFromStore(storeName: StoreKeys, key: any) {

  const cachedItems = await spfxExtensionsCoreDB.getAll(storeName);
  const nowTime = new Date();
  const cacheToRemove = cachedItems.filter((ci) => {
    const itemExpires = new Date(ci.expires);
    //the items that should be removed
    return nowTime >= itemExpires;
  });

  const toEvict = cacheToRemove.length;
  if (toEvict > 0) {
    const tx = spfxExtensionsCoreDB.transaction(storeName as any, "readwrite");
    const txStore = tx.objectStore(storeName);
    cacheToRemove.forEach((u) => txStore.delete((u as any)[key]));
    await tx.done;
    console.warn(SPFxExtensionCore, `Evicted ${toEvict} items from ${storeName} cache.`);
  }
  return toEvict;
}

export async function getAllExtensionConfig() {
  await evictItemsFromStore(StoreNames.SPFxExtensionConfig, "Title");
  return spfxExtensionsCoreDB.getAll(StoreNames.SPFxExtensionConfig);
}
export async function getExtensionConfig(title: string) {
  await evictItemsFromStore(StoreNames.SPFxExtensionConfig, "Title");
  return spfxExtensionsCoreDB.get(StoreNames.SPFxExtensionConfig, title);
}

export async function addOrUpdateExtensionConfig(
  item: ConfigurationListData,
  cacheTimeMinutes = 60
) {
  await spfxExtensionsCoreDB.put(StoreNames.SPFxExtensionConfig, {
    ...item,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}
export function addOrUpdateExtensionConfigs(items: ConfigurationListData[]) {
  const tx = spfxExtensionsCoreDB.transaction(StoreNames.SPFxExtensionConfig, "readwrite");
  const txStore = tx.objectStore(StoreNames.SPFxExtensionConfig);
  items.forEach((u) => txStore.put({ ...u, ...getCacheItemBase(60) }));
  return tx.done;
}

export function removeExtensionConfigFromCache(title: string) {
  return spfxExtensionsCoreDB.delete(StoreNames.SPFxExtensionConfig, title);
}