import { SPFX_SOLUTION_ID } from "../../utilities/constants";
import { getContentDigest } from "../../utilities/digest";
import { getCoreConfig } from "./coreConfigService";
import { addOrUpdateExtensionConfig } from "./coreIdbService";
import { logGenericCoreInfo } from "./loggingService";
export async function cleanCacheOnUpgrade() {
  let coreConfig = await getCoreConfig();
  const keyParts = [SPFX_SOLUTION_ID];
  if (coreConfig.find((c) => c.Title === "Version")?.Data !== BUILD_DATE) {
    await addOrUpdateExtensionConfig({ Title: "Version", Data: BUILD_DATE }, Infinity);
    await cleanStorageCache(keyParts, true);
  }
}

export async function cleanStorageCache(keyParts: string[], reloadOnClean: boolean) {
  const allStorages = await window.caches.keys();
  let somethingDeleted = false;
  for (const storageKey of allStorages) {
    const storage = await window.caches.open(storageKey);
    const allKeys = await storage.keys();
    const allPromises: Promise<boolean>[] = [];
    for (const key of allKeys) {
      const url = key.url.toLowerCase();
      if (keyParts.some((k) => url.indexOf(k.toLowerCase()) > -1)) {
        logGenericCoreInfo("Deleting cache key", key, "from", storageKey);
        somethingDeleted = true;
        allPromises.push(
          storage.delete(key, { ignoreMethod: true, ignoreSearch: true, ignoreVary: true })
        );
      }
    }
    await Promise.allSettled(allPromises);
  }
  if (somethingDeleted && reloadOnClean) {
    window.location.reload();
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
