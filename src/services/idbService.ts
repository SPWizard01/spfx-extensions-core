import { type DBSchema, openDB, deleteDB } from "idb";
import type {
  AppCollectionManifest,
  AppCollectionManifestCacheItem,
  AppFolderManifest,
  AppFolderManifestCacheItem,
  ManifestBase,
  ManifestItem,
} from "../models/cache";
import type { AllowedAppsListData } from "../models/allowedAppsListData";
import { DEBUG_KEYS, isInDebug } from "../utilities/debug";
import { SPFxExtensionCore } from "../utilities/constants";
import type { HubData } from "../models/hubData";

interface spfxExtensionsCoreDB extends DBSchema {
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
}

const AppFolderManifestCache = "AppFolderManifestCache";
const AppCollectionManifestCache = "AppCollectionManifestCache";
const AllowedApps = "AllowedApps";
const HubSiteData = "HubSiteData";

const DBNAME = `${DEBUG_KEYS.SPFXEXT}COREDB`;
const openDBPromise = openDB<spfxExtensionsCoreDB>(DBNAME, 3, {
  blocking(_currentVersion, _blockedVersion, _event) {
    spfxExtensionsCoreDB.close();
    alert("A new version of this page is ready. Please reload the page.");
  },
  async upgrade(database, oldVersion, newVersion, transaction, event) {
    /// Create the object store
    if (oldVersion === 0) {
      database.createObjectStore(AppFolderManifestCache, { keyPath: "url" });
      database.createObjectStore(AppCollectionManifestCache, {
        keyPath: "url",
      });
      database.createObjectStore(AllowedApps, { keyPath: "Id" });
      database.createObjectStore(HubSiteData, { keyPath: "SiteId" });
    }
    //diff between 0 and 1 just delete the old database and let it be repopulated
    if (oldVersion === 1) {
      database.createObjectStore(AllowedApps, { keyPath: "Id" });
    }
    if (oldVersion === 2) {
      database.createObjectStore(HubSiteData, { keyPath: "SiteId" });
    }
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

const spfxExtensionsCoreDB = await openDBPromise;

function getCacheItemBase(cacheTimeMinutes: number) {
  const dateNow = new Date();
  const date = dateNow.toISOString();
  dateNow.setMinutes(dateNow.getMinutes() + cacheTimeMinutes);
  const expires = dateNow.toISOString();
  return {
    date,
    domain: window.location.host,
    expires,
  };
}

export async function getAllAppCollections() {
  return spfxExtensionsCoreDB.getAll(AppCollectionManifestCache);
}

export async function getAllAppManifests() {
  return spfxExtensionsCoreDB.getAll(AppFolderManifestCache);
}

export async function getAllAllowedApps() {
  return spfxExtensionsCoreDB.getAll(AllowedApps);
}

export async function getAllHubData() {
  return spfxExtensionsCoreDB.getAll(HubSiteData);
}

export async function getAppFolderManifestCacheItem(url: string) {
  return spfxExtensionsCoreDB.get(AppFolderManifestCache, url);
}

export async function getAppCollectionManifestCacheItem(url: string) {
  return spfxExtensionsCoreDB.get(AppCollectionManifestCache, url);
}

export async function getAllowedAppCacheItem(id: number) {
  return spfxExtensionsCoreDB.get(AllowedApps, id);
}

export async function getHubData(id: string) {
  return spfxExtensionsCoreDB.get(HubSiteData, id);
}

export async function addOrUpdateHubDataToCache(
  item: HubData,
  cacheTimeMinutes = 60
) {
  await spfxExtensionsCoreDB.put(HubSiteData, {
    ...item,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function addOrUpdateAppCollectionToCache(
  item: AppCollectionManifest,
  cacheTimeMinutes = 60
) {
  await spfxExtensionsCoreDB.put(AppCollectionManifestCache, {
    ...item,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function addOrUpdateAppFolderManifestToCache(
  item: AppFolderManifest,
  cacheTimeMinutes = 60
) {
  await spfxExtensionsCoreDB.put(AppFolderManifestCache, {
    ...item,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function addOrUpdateAllowedAppToCache(
  item: AllowedAppsListData,
  cacheTimeMinutes = 5
) {
  await spfxExtensionsCoreDB.put(AllowedApps, {
    ...item,
    ...getCacheItemBase(cacheTimeMinutes),
  });
}

export async function addOrUpdateAllowedAppsToCache(
  items: AllowedAppsListData[],
  cacheTimeMinutes = 5
) {
  const baseCache = getCacheItemBase(cacheTimeMinutes);
  const tx = spfxExtensionsCoreDB.transaction(AllowedApps, "readwrite");
  const txStore = tx.objectStore(AllowedApps);
  items.forEach((item) => txStore.put({ ...baseCache, ...item }));
  return tx.done;
}

export function clearAppCollectionManifestCache() {
  return spfxExtensionsCoreDB.clear(AppCollectionManifestCache);
}

export function clearAppFolderManifestCache() {
  return spfxExtensionsCoreDB.clear(AppFolderManifestCache);
}

export function clearAllowedAppsCache() {
  return spfxExtensionsCoreDB.clear(AllowedApps);
}

export function removeAppCollectionManifestFromCache(url: string) {
  return spfxExtensionsCoreDB.delete(AppCollectionManifestCache, url);
}

export function removeAppCollectionManifestsFromCache(url: string[]) {
  const tx = spfxExtensionsCoreDB.transaction(AppCollectionManifestCache, "readwrite");
  const txStore = tx.objectStore(AppCollectionManifestCache);
  url.forEach((u) => txStore.delete(u));
  return tx.done;
}

export function removeAppFolderManifestFromCache(url: string) {
  return spfxExtensionsCoreDB.delete(AppFolderManifestCache, url);
}

export function removeAppFolderManifestsFromCache(url: string[]) {
  const tx = spfxExtensionsCoreDB.transaction(AppFolderManifestCache, "readwrite");
  const txStore = tx.objectStore(AppFolderManifestCache);
  url.forEach((u) => txStore.delete(u));
  return tx.done;
}

export function removeAllowedAppFromCache(id: number) {
  return spfxExtensionsCoreDB.delete(AllowedApps, id);
}

export function removeAllowedAppsFromCache(id: number[]) {
  const tx = spfxExtensionsCoreDB.transaction(AllowedApps, "readwrite");
  const txStore = tx.objectStore(AllowedApps);
  id.forEach((u) => txStore.delete(u));
  return tx.done;
}

export function removeHubDataFromCache(id: string[]) {
  const tx = spfxExtensionsCoreDB.transaction(HubSiteData, "readwrite");
  const txStore = tx.objectStore(HubSiteData);
  id.forEach((u) => txStore.delete(u));
  return tx.done;
}

export async function evictManifestCache(
  isAppCollection: boolean,
  item?: ManifestBase
) {
  const cache = isAppCollection
    ? await getAllAppCollections()
    : await getAllAppManifests();
  const nowTime = new Date();
  const cacheToRemove = cache.filter((ci) => {
    const itemExpires = new Date(ci.expires);
    //the items that should be removed
    return nowTime >= itemExpires;
  });
  if (item) {
    //check if there is an item that should be evicted
    const matchingItem = isAppCollection
      ? await getAppCollectionManifestCacheItem(item.url)
      : await getAppFolderManifestCacheItem(item.url);
    if (matchingItem) {
      if (matchingItem.hash !== item.hash) {
        console.warn(
          `Evicted ${matchingItem.url} from ${
            isAppCollection ? "AppCollection" : "AppManifest"
          } cache. Because of hash mismatch.`
        );
        isAppCollection
          ? await removeAppCollectionManifestFromCache(item.url)
          : await removeAppFolderManifestFromCache(item.url);
      }
    }
  }

  const toEvict = cacheToRemove.length;
  if (toEvict > 0) {
    isAppCollection
      ? await removeAppCollectionManifestsFromCache(
          cacheToRemove.map((c) => c.url)
        )
      : await removeAppFolderManifestsFromCache(
          cacheToRemove.map((c) => c.url)
        );
    console.warn(
      SPFxExtensionCore,
      `Evicted ${toEvict} items from ${
        isAppCollection ? "AppCollection" : "AppManifest"
      } cache.`
    );
  }
}

export async function evictAllowedAppsCache() {
  const cache = await getAllAllowedApps();
  const nowTime = new Date();
  const cacheToRemove = cache.filter((ci) => {
    const itemExpires = new Date(ci.expires);
    //the items that should be removed
    return nowTime >= itemExpires;
  });

  const toEvict = cacheToRemove.length;
  if (toEvict > 0) {
    await removeAllowedAppsFromCache(cacheToRemove.map((c) => c.Id));
    console.warn(SPFxExtensionCore, `Evicted ${toEvict} items from AllowedApps cache.`);
  }
  return toEvict;
}

export async function evictHubDataCache() {
  const cache = await getAllHubData();
  const nowTime = new Date();
  const cacheToRemove = cache.filter((ci) => {
    const itemExpires = new Date(ci.expires);
    //the items that should be removed
    return nowTime >= itemExpires;
  });

  const toEvict = cacheToRemove.length;
  if (toEvict > 0) {
    await removeHubDataFromCache(cacheToRemove.map((c) => c.SiteId));
    console.warn(SPFxExtensionCore, `Evicted ${toEvict} items from ${HubSiteData} cache.`);
  }
}

export async function getManifestFromCache(
  url: string,
  isAppCollection: boolean
) {
  //first lets do cache eviction
  await evictManifestCache(isAppCollection);

  //do not get cached manifests when debugging
  if (isInDebug) {
    return undefined;
  }

  return isAppCollection
    ? getAppCollectionManifestCacheItem(url)
    : getAppFolderManifestCacheItem(url);
}

export async function setOrUpdateManifest(
  retResult: ManifestItem,
  cacheTimeMinutes: number
) {
  await evictManifestCache(retResult.isAppCollection, retResult);
  const foundItem = retResult.isAppCollection
    ? await getAppCollectionManifestCacheItem(retResult.url)
    : await getAppFolderManifestCacheItem(retResult.url);
  if (foundItem && foundItem.hash === retResult.hash && !isInDebug) {
    return;
  }

  retResult.isAppCollection
    ? await addOrUpdateAppCollectionToCache(retResult, cacheTimeMinutes)
    : await addOrUpdateAppFolderManifestToCache(retResult, cacheTimeMinutes);
}
