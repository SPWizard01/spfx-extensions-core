import { getContentDigest } from "../../utilities/digest";
import { getCoreConfig } from "./coreConfigService";
import { addOrUpdateExtensionConfig } from "./coreIdbService";
export async function cleanCacheOnUpgrade() {
    let coreConfig = await getCoreConfig();
    const keyParts = [
        "spfxextensions",
        "ff36e5d0-f7c7-421d-9e21-0a422626209a"
    ]
    if (coreConfig.find(c => c.Title === "Version")?.Data !== BUILD_DATE) {
        coreConfig = await getCoreConfig(true);
        addOrUpdateExtensionConfig({ Title: "Version", Data: BUILD_DATE, date: "", expires: "" }, 240);
        const allStorages = await caches.keys();
        let somethingDeleted = false;
        for (const storageKey of allStorages) {
            const storage = await caches.open(storageKey);
            const allKeys = await storage.keys();
            const allPromises: Promise<boolean>[] = [];
            for (const key of allKeys) {
                const url = key.url.toLowerCase();
                if (keyParts.some(k => url.indexOf(k) > -1)) {
                    console.log("Deleting cache key", key);
                    somethingDeleted = true;
                    allPromises.push(storage.delete(key, { ignoreMethod: true, ignoreSearch: true }));
                }
            }
            await Promise.allSettled(allPromises);
        }
        if (somethingDeleted) {
            window.location.reload();
        }
    }
}

export function GetCacheStringForAsset(start: number, cacheTimeMinutes: number) {
    const cacheDate = new Date(start);
    const now = new Date();
    while (cacheDate < now) {
        cacheDate.setMinutes(cacheDate.getMinutes() + cacheTimeMinutes);
    }
    return `${cacheDate.getTime()}`;
}

export async function GetCacheStringHashForAssetAsync(start: number, cacheTimeMinutes: number) {
    const cachedTime = GetCacheStringForAsset(start, cacheTimeMinutes);
    const cacheDateStr = await getContentDigest(cachedTime, 13);
    return cacheDateStr;
}

export function GetRandomCacheStringAsync() {
    
    return getContentDigest(`${Date.now()}`, 13);
}