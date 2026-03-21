import { deleteDB, openDB, type DBSchema } from "idb";
import type { AllowedAppsListData } from "../../models/allowedAppsListData";
import type {
  AppCollectionManifestCacheItem,
  AppFolderManifestCacheItem,
  CacheableAppCollectionManifest,
  CacheableAppFolderManifest,
} from "../../models/cache";
import type {
  ConfigurationListBaseData,
  ConfigurationListData,
} from "../../models/configurationList";
import type { HubData } from "../../models/hubData";
import { APPCOLLECTION_MANIFEST_NAME, MANIFEST_NAME } from "../../utilities/constants";
import { DEBUG_KEY_APP_PREFIX } from "../../utilities/runtimeConstants";
import { cleanStorageCache } from "./browserCache";
import { logGenericCoreError, logGenericCoreWarning } from "./loggingService";

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
    value: ConfigurationListData;
  };
  // PNP_CACHE: {
  //     key: string;
  //     value: PNPCacheItem;
  // };
}

export interface SPFxExtensionCoreDB extends DBSchema, SPFxExtensionSchema {}

type StoreKeys = keyof SPFxExtensionSchema;

export const StoreNames = {
  AppFolderManifestCache: "AppFolderManifestCache",
  AppCollectionManifestCache: "AppCollectionManifestCache",
  AllowedApps: "AllowedApps",
  HubSiteData: "HubSiteData",
  SPFxExtensionConfig: "SPFxExtensionConfig",
  // PNP_CACHE: "PNP_CACHE",
} as const;

const DBNAME = `${DEBUG_KEY_APP_PREFIX}COREDB`;
const openDBPromise = openDB<SPFxExtensionCoreDB>(DBNAME, 1, {
  blocking(_currentVersion, _blockedVersion, _event) {
    openDBPromise.then((db) => db.close());
    alert("A new version of this page is ready. Please reload the page.");
  },
  async upgrade(database, oldVersion, _newVersion, _transaction, _event) {
    /// Create the object store
    if (oldVersion === 0) {
      database.createObjectStore(StoreNames.AppFolderManifestCache, { keyPath: "url" });
      database.createObjectStore(StoreNames.AppCollectionManifestCache, {
        keyPath: "url",
      });
      database.createObjectStore(StoreNames.AllowedApps, { keyPath: "Id" });
      database.createObjectStore(StoreNames.HubSiteData, { keyPath: "SiteId" });
      database.createObjectStore(StoreNames.SPFxExtensionConfig, { keyPath: "Title" });
      // database.createObjectStore(StoreNames.PNP_CACHE, { keyPath: "keyHash" });
    }
    //diff between 0 and 1 just delete the old database and let it be repopulated
    // if (oldVersion === 1) {
    //   database.createObjectStore(AllowedApps, { keyPath: "Id" });
    // }
  },
});
openDBPromise.catch((err) => {
  logGenericCoreError("Error opening database for Core, please contact your administrator.");
  deleteDB(DBNAME).then(() => {
    window.location.reload();
  });
  throw err;
});
export const spfxExtensionsCoreDB = await openDBPromise;

function getCacheItemBase(cacheTimeMinutes: number) {
  let expires = "never";
  if (cacheTimeMinutes !== Infinity) {
    const dateNow = new Date();
    dateNow.setMinutes(dateNow.getMinutes() + cacheTimeMinutes);
    expires = dateNow.toISOString();
  }
  return {
    // domain: window.location.host,
    expires,
  };
}

async function evictItemsFromStore(storeName: StoreKeys, key: any) {
  const cachedItems = await spfxExtensionsCoreDB.getAll(storeName);
  const nowTime = new Date();
  const cacheToRemove = cachedItems.filter((ci) => {
    if (ci.expires === "never") return false;
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
    logGenericCoreWarning(`Evicted ${toEvict} items from ${storeName} cache.`);
  }
  return toEvict;
}

export async function getAllExtensionConfigFromDB() {
  await evictItemsFromStore(StoreNames.SPFxExtensionConfig, "Title");

  return spfxExtensionsCoreDB.getAll(StoreNames.SPFxExtensionConfig);
}
export async function getExtensionConfigFromDB(title: string) {
  await evictItemsFromStore(StoreNames.SPFxExtensionConfig, "Title");

  return spfxExtensionsCoreDB.get(StoreNames.SPFxExtensionConfig, title);
}

export async function addOrUpdateExtensionConfig(
  item: ConfigurationListBaseData,
  cacheTimeMinutes = 60
) {
  await spfxExtensionsCoreDB.put(StoreNames.SPFxExtensionConfig, {
    ...item,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function addOrUpdateExtensionConfigs(
  items: ConfigurationListBaseData[],
  cacheTimeMinutes: number
) {
  const tx = spfxExtensionsCoreDB.transaction(StoreNames.SPFxExtensionConfig, "readwrite");
  const txStore = tx.objectStore(StoreNames.SPFxExtensionConfig);
  items.forEach((u) => txStore.put({ ...u, ...getCacheItemBase(cacheTimeMinutes) }));
  return tx.done;
}

export async function getAllAllowedAppsFromDB() {
  return spfxExtensionsCoreDB.getAll(StoreNames.AllowedApps);
}

async function getManifestTXTCacheItem(url: string) {
  return spfxExtensionsCoreDB.get(StoreNames.AppFolderManifestCache, url);
}

async function getCollectionConfigCacheItem(url: string) {
  return spfxExtensionsCoreDB.get(StoreNames.AppCollectionManifestCache, url);
}

export async function getHubData(id: string) {
  return spfxExtensionsCoreDB.get(StoreNames.HubSiteData, id);
}

export async function addOrUpdateHubDataToCache(item: HubData, cacheTimeMinutes = 60) {
  await spfxExtensionsCoreDB.put(StoreNames.HubSiteData, {
    ...item,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function addOrUpdateAllowedAppsToCache(
  items: AllowedAppsListData[],
  cacheTimeMinutes = 5
) {
  const baseCache = getCacheItemBase(cacheTimeMinutes);
  const tx = spfxExtensionsCoreDB.transaction(StoreNames.AllowedApps, "readwrite");
  const txStore = tx.objectStore(StoreNames.AllowedApps);
  items.forEach((item) => txStore.put({ ...item, ...baseCache }));
  return tx.done;
}

async function removeAppCollectionManifestFromCache(url: string) {
  return spfxExtensionsCoreDB.delete(StoreNames.AppCollectionManifestCache, url);
}

async function removeAppFolderManifestFromCache(url: string) {
  return spfxExtensionsCoreDB.delete(StoreNames.AppFolderManifestCache, url);
}

export async function evictAllowedAppsCache() {
  return evictItemsFromStore(StoreNames.AllowedApps, "Id");
}

export async function evictHubDataCache() {
  return evictItemsFromStore(StoreNames.HubSiteData, "SiteId");
}

export async function evictManifestTXTCache(item?: CacheableAppFolderManifest) {
  if (item) {
    //check if there is an item that should be evicted
    const matchingItem = await getManifestTXTCacheItem(item.url);
    if (matchingItem) {
      if (matchingItem.hash !== item.hash) {
        await removeAppFolderManifestFromCache(item.url);
        const pathUrl = item.url.toLowerCase().replace(`/${MANIFEST_NAME}`, "");
        await cleanStorageCache([pathUrl], false);
        logGenericCoreWarning(
          `Evicted ${MANIFEST_NAME} ${matchingItem.url} from cache. Because of hash mismatch.`
        );
      }
    }
  }
  return evictItemsFromStore(StoreNames.AppFolderManifestCache, "url");
}

async function evictCollectionConfigCache(item?: CacheableAppCollectionManifest) {
  if (item) {
    //check if there is an item that should be evicted
    const matchingItem = await getCollectionConfigCacheItem(item.url);
    if (matchingItem) {
      if (matchingItem.hash !== item.hash) {
        await removeAppCollectionManifestFromCache(item.url);
        await cleanStorageCache([item.url], false);
        logGenericCoreWarning(
          `Evicted ${APPCOLLECTION_MANIFEST_NAME} ${matchingItem.url} from cache. Because of hash mismatch.`
        );
      }
    }
  }
  return evictItemsFromStore(StoreNames.AppCollectionManifestCache, "url");
}

export async function getManifestTXTFromCache(url: string) {
  //first lets do cache eviction
  await evictManifestTXTCache();
  return getManifestTXTCacheItem(url);
}

export async function setOrUpdateManifestTXT(
  retResult: CacheableAppFolderManifest,
  cacheTimeMinutes: number
) {
  await evictManifestTXTCache(retResult);
  await spfxExtensionsCoreDB.put(StoreNames.AppFolderManifestCache, {
    ...retResult,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function setOrUpdateCollectionConfig(
  retResult: CacheableAppCollectionManifest,
  cacheTimeMinutes: number
) {
  await evictCollectionConfigCache(retResult);
  await spfxExtensionsCoreDB.put(StoreNames.AppCollectionManifestCache, {
    ...retResult,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function getCollectionConfigFromCache(url: string) {
  //first lets do cache eviction
  await evictCollectionConfigCache();
  return getCollectionConfigCacheItem(url);
}
