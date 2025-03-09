import { deleteDB, openDB, type DBSchema } from "idb";
import type { AllowedAppsListData } from "../../models/allowedAppsListData";
import type { AppCollectionManifest, AppCollectionManifestCacheItem, AppFolderManifest, AppFolderManifestCacheItem, ManifestBase, ManifestItem } from "../../models/cache";
import type { ConfigurationListData } from "../../models/configurationList";
import type { HubData } from "../../models/hubData";
import { DEBUG_KEYS, isInDebug } from "../../utilities/debug";
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


const DBNAME = `${DEBUG_KEYS.SPFXEXT}COREDB`;
const openDBPromise = openDB<SPFxExtensionsCoreDB>(DBNAME, 1, {
    blocking(_currentVersion, _blockedVersion, _event) {
        spfxExtensionsCoreDB.close();
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
        }
        //diff between 0 and 1 just delete the old database and let it be repopulated
        // if (oldVersion === 1) {
        //   database.createObjectStore(AllowedApps, { keyPath: "Id" });
        // }
    },
});
openDBPromise.catch((err) => {
    logGenericCoreError(
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
    item: ConfigurationListData,
    cacheTimeMinutes = 60
) {
    await spfxExtensionsCoreDB.put(StoreNames.SPFxExtensionConfig, {
        ...item,
        ...getCacheItemBase(cacheTimeMinutes),
    });
}
export function addOrUpdateExtensionConfigs(items: ConfigurationListData[], cacheTimeMinutes: number) {
    const tx = spfxExtensionsCoreDB.transaction(StoreNames.SPFxExtensionConfig, "readwrite");
    const txStore = tx.objectStore(StoreNames.SPFxExtensionConfig);
    items.forEach((u) => txStore.put({ ...u, ...getCacheItemBase(cacheTimeMinutes) }));
    return tx.done;
}

export function removeExtensionConfigFromCache(title: string) {
    return spfxExtensionsCoreDB.delete(StoreNames.SPFxExtensionConfig, title);
}


export async function getAllAppCollections() {
    return spfxExtensionsCoreDB.getAll(StoreNames.AppCollectionManifestCache);
}

export async function getAllAppManifests() {
    return spfxExtensionsCoreDB.getAll(StoreNames.AppFolderManifestCache);
}

export async function getAllAllowedAppsFromDB() {
    return spfxExtensionsCoreDB.getAll(StoreNames.AllowedApps);
}

export async function getAllHubData() {
    return spfxExtensionsCoreDB.getAll(StoreNames.HubSiteData);
}

export async function getAppFolderManifestCacheItem(url: string) {
    return spfxExtensionsCoreDB.get(StoreNames.AppFolderManifestCache, url);
}

export async function getAppCollectionManifestCacheItem(url: string) {
    return spfxExtensionsCoreDB.get(StoreNames.AppCollectionManifestCache, url);
}

export async function getAllowedAppCacheItem(id: number) {
    return spfxExtensionsCoreDB.get(StoreNames.AllowedApps, id);
}

export async function getHubData(id: string) {
    return spfxExtensionsCoreDB.get(StoreNames.HubSiteData, id);
}

export async function addOrUpdateHubDataToCache(
    item: HubData,
    cacheTimeMinutes = 60
) {
    await spfxExtensionsCoreDB.put(StoreNames.HubSiteData, {
        ...item,
        ...getCacheItemBase(cacheTimeMinutes),
    });
}

export async function addOrUpdateAppCollectionToCache(
    item: AppCollectionManifest,
    cacheTimeMinutes = 60
) {
    await spfxExtensionsCoreDB.put(StoreNames.AppCollectionManifestCache, {
        ...item,
        ...getCacheItemBase(cacheTimeMinutes),
    });
}

export async function addOrUpdateAppFolderManifestToCache(
    item: AppFolderManifest,
    cacheTimeMinutes = 60
) {
    await spfxExtensionsCoreDB.put(StoreNames.AppFolderManifestCache, {
        ...item,
        ...getCacheItemBase(cacheTimeMinutes),
    });
}

export async function addOrUpdateAllowedAppToCache(
    item: AllowedAppsListData,
    cacheTimeMinutes = 5
) {
    await spfxExtensionsCoreDB.put(StoreNames.AllowedApps, {
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
    items.forEach((item) => txStore.put({ ...baseCache, ...item }));
    return tx.done;
}

export function clearAppCollectionManifestCache() {
    return spfxExtensionsCoreDB.clear(StoreNames.AppCollectionManifestCache);
}

export function clearAppFolderManifestCache() {
    return spfxExtensionsCoreDB.clear(StoreNames.AppFolderManifestCache);
}

export function clearAllowedAppsCache() {
    return spfxExtensionsCoreDB.clear(StoreNames.AllowedApps);
}

export function removeAppCollectionManifestFromCache(url: string) {
    return spfxExtensionsCoreDB.delete(StoreNames.AppCollectionManifestCache, url);
}

export function removeAppCollectionManifestsFromCache(url: string[]) {
    const tx = spfxExtensionsCoreDB.transaction(StoreNames.AppCollectionManifestCache, "readwrite");
    const txStore = tx.objectStore(StoreNames.AppCollectionManifestCache);
    url.forEach((u) => txStore.delete(u));
    return tx.done;
}

export function removeAppFolderManifestFromCache(url: string) {
    return spfxExtensionsCoreDB.delete(StoreNames.AppFolderManifestCache, url);
}

export function removeAppFolderManifestsFromCache(url: string[]) {
    const tx = spfxExtensionsCoreDB.transaction(StoreNames.AppFolderManifestCache, "readwrite");
    const txStore = tx.objectStore(StoreNames.AppFolderManifestCache);
    url.forEach((u) => txStore.delete(u));
    return tx.done;
}

export async function evictManifestCache(
    isAppCollection: boolean,
    item?: ManifestBase
) {
    if (item) {
        //check if there is an item that should be evicted
        const matchingItem = isAppCollection
            ? await getAppCollectionManifestCacheItem(item.url)
            : await getAppFolderManifestCacheItem(item.url);
        if (matchingItem) {
            if (matchingItem.hash !== item.hash) {
                if (isAppCollection) {
                    await removeAppCollectionManifestFromCache(item.url)
                } else {
                    await removeAppFolderManifestFromCache(item.url);
                }
                logGenericCoreWarning(
                    `Evicted ${matchingItem.url} from ${isAppCollection ? "AppCollection" : "AppManifest"
                    } cache. Because of hash mismatch.`
                );
            }
        }
    }
    return isAppCollection ? evictAppCollectionCache() : evictManifestFolderCache();
}

async function evictAppCollectionCache() {
    return evictItemsFromStore(StoreNames.AppCollectionManifestCache, "url");
}
async function evictManifestFolderCache() {
    return evictItemsFromStore(StoreNames.AppFolderManifestCache, "url");
}

export async function evictAllowedAppsCache() {
    return evictItemsFromStore(StoreNames.AllowedApps, "Id");
}

export async function evictHubDataCache() {
    return evictItemsFromStore(StoreNames.HubSiteData, "SiteId");
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

    if (retResult.isAppCollection) {
        await addOrUpdateAppCollectionToCache(retResult, cacheTimeMinutes)
    } else {
        await addOrUpdateAppFolderManifestToCache(retResult, cacheTimeMinutes);
    }
}
