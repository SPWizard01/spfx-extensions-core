import type { AllowedAppsListData } from "../../models/allowedAppsListData";
import type { AppCollectionManifest, AppFolderManifest, ManifestBase, ManifestItem } from "../../models/cache";
import type { HubData } from "../../models/hubData";
import { evictItemsFromStore, getCacheItemBase, spfxExtensionsCoreDB, StoreNames } from "../../services/idbService";
import { isInDebug } from "../../utilities/debug";


export async function getAllAppCollections() {
    return spfxExtensionsCoreDB.getAll(StoreNames.AppCollectionManifestCache);
}

export async function getAllAppManifests() {
    return spfxExtensionsCoreDB.getAll(StoreNames.AppFolderManifestCache);
}

export async function getAllAllowedApps() {
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
                isAppCollection
                    ? await removeAppCollectionManifestFromCache(item.url)
                    : await removeAppFolderManifestFromCache(item.url);
                console.warn(
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

    retResult.isAppCollection
        ? await addOrUpdateAppCollectionToCache(retResult, cacheTimeMinutes)
        : await addOrUpdateAppFolderManifestToCache(retResult, cacheTimeMinutes);
}
