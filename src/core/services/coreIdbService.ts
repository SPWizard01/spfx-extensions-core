import { deleteDB, openDB, type DBSchema } from "idb";
import type { AllowedAppsListData } from "../../models/allowedAppsListData";
import type { AppCollectionManifest, AppCollectionManifestCacheItem, AppFolderManifest, AppFolderManifestCacheItem } from "../../models/cache";
import type { ConfigurationListData } from "../../models/configurationList";
import type { HubData } from "../../models/hubData";
import { APPCOLLECTION_MANIFEST_NAME, MANIFEST_NAME } from "../../utilities/constants";
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

function getCacheItemBase(cacheTimeMinutes: number) {
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

async function evictItemsFromStore(storeName: StoreKeys, key: any) {

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


export async function getAllAllowedAppsFromDB() {
    return spfxExtensionsCoreDB.getAll(StoreNames.AllowedApps);
}

async function getManifestTXTCacheItem(url: string) {
    return spfxExtensionsCoreDB.get(StoreNames.AppFolderManifestCache, url);
}

async function getAppsTXTCacheItem(url: string) {
    return spfxExtensionsCoreDB.get(StoreNames.AppCollectionManifestCache, url);
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

async function addOrUpdateAppsTXTToCache(
    item: AppCollectionManifest,
    cacheTimeMinutes = 60
) {
    await spfxExtensionsCoreDB.put(StoreNames.AppCollectionManifestCache, {
        ...item,
        ...getCacheItemBase(cacheTimeMinutes),
    });
}

async function addOrUpdateManifestTXTToCache(
    item: AppFolderManifest,
    cacheTimeMinutes = 60
) {
    await spfxExtensionsCoreDB.put(StoreNames.AppFolderManifestCache, {
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

function removeAppCollectionManifestFromCache(url: string) {
    return spfxExtensionsCoreDB.delete(StoreNames.AppCollectionManifestCache, url);
}

function removeAppFolderManifestFromCache(url: string) {
    return spfxExtensionsCoreDB.delete(StoreNames.AppFolderManifestCache, url);
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


export async function evictManifestTXTCache(
    item?: AppFolderManifest
) {
    if (item) {
        //check if there is an item that should be evicted
        const matchingItem = await getManifestTXTCacheItem(item.url)
        if (matchingItem) {
            if (matchingItem.hash !== item.hash) {
                await removeAppFolderManifestFromCache(item.url);
                logGenericCoreWarning(
                    `Evicted ${MANIFEST_NAME} ${matchingItem.url} from cache. Because of hash mismatch.`
                );
            }
        }
    }
    return evictManifestFolderCache();
}
export async function evictAppsTXTCache(
    item?: AppCollectionManifest
) {
    if (item) {
        //check if there is an item that should be evicted
        const matchingItem = await getAppsTXTCacheItem(item.url);
        if (matchingItem) {
            if (matchingItem.hash !== item.hash) {
                await removeAppCollectionManifestFromCache(item.url)
                logGenericCoreWarning(
                    `Evicted ${APPCOLLECTION_MANIFEST_NAME} ${matchingItem.url} from cache. Because of hash mismatch.`
                );
            }
        }
    }
    return evictAppCollectionCache();
}


export async function getManifestTXTFromCache(
    url: string,
) {
    //first lets do cache eviction
    await evictManifestTXTCache();

    //do not get cached manifests when debugging
    if (isInDebug) {
        return undefined;
    }

    return getManifestTXTCacheItem(url);
}

export async function setOrUpdateManifestTXT(
    retResult: AppFolderManifest,
    cacheTimeMinutes: number
) {
    await evictManifestTXTCache(retResult);
    const foundItem = await getManifestTXTCacheItem(retResult.url);
    if (foundItem && foundItem.hash === retResult.hash && !isInDebug) {
        return;
    }
    await addOrUpdateManifestTXTToCache(retResult, cacheTimeMinutes);
}

export async function setOrUpdateAppCollectionTXT(
    retResult: AppCollectionManifest,
    cacheTimeMinutes: number
) {
    await evictAppsTXTCache(retResult);
    const foundItem = await getAppsTXTCacheItem(retResult.url)
    if (foundItem && foundItem.hash === retResult.hash && !isInDebug) {
        return;
    }
    await addOrUpdateAppsTXTToCache(retResult, cacheTimeMinutes)
}

export async function getAppCollectionTXTFromCache(
    url: string,
) {
    //first lets do cache eviction
    await evictAppsTXTCache();

    //do not get cached manifests when debugging
    if (isInDebug) {
        return undefined;
    }
    return getAppsTXTCacheItem(url)
}
