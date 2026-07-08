import { SPFX_SOLUTION_ID } from "../../utilities/constants";
import { getContentHash } from "../../utilities/digest";
import { isFreshCoreDB } from "./coreIdbService";
import { logGenericCoreInfo } from "./loggingService";
export async function cleanCacheOnUpgrade() {
  // The core DB name is suffixed with the package version, so a freshly created DB means a
  // new build was deployed. Bust the solution's HTTP asset caches exactly once per version.
  if (isFreshCoreDB) {
    await cleanStorageCache([SPFX_SOLUTION_ID], true);
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
  const cacheDateStr = await getContentHash(cachedTime, 13);
  return cacheDateStr;
}

export function GetRandomCacheStringAsync() {
  return getContentHash(`${Date.now()}`, 13);
}
