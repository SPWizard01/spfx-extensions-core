import { DEBUG_KEY_CORE } from "../../utilities/runtimeConstants";
import { evictCollectionConfigCache, evictManifestTXTCache } from "./coreIdbService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreInfo } from "./loggingService";
import { fetchAppCollectionConfigFromAllLocations } from "./txtAppsService";
import { getManifestTXTFromAllLocations } from "./txtManifestService";
const CORE_MANIFEST_CHECK = "CORE_MANIFEST_CHECK";
const CORE_MANIFEST_CHECK_INTERVAL = window.localStorage.getItem(DEBUG_KEY_CORE)?.trim()
  ? 10000
  : 90000;
let manifestWatch: number = 0;

export function registerManifestWatcher(contextChange = false) {
  if (contextChange) {
    window.clearInterval(manifestWatch);
    manifestWatch = 0;
  }
  if (manifestWatch > 0) return;
  manifestWatch = window.setInterval(performManifestCheck, CORE_MANIFEST_CHECK_INTERVAL);
  //do not await, just check in background first time.
  performManifestCheck();
}

export async function performManifestCheck() {
  try {
    const item = window.localStorage.getItem(CORE_MANIFEST_CHECK);
    if (item) {
      const lastCheck = new Date(item);
      const now = new Date();
      const diff = now.getTime() - lastCheck.getTime();
      const maxDiff = CORE_MANIFEST_CHECK_INTERVAL; //2 seconds buffer
      //add 2 seconds since interval is not reliable and exact
      if (diff < maxDiff) {
        logGenericCoreDebug(
          "Manifest check already performed recently, skipping.",
          `${diff} < ${maxDiff}`
        );
        return;
      }
    }
    logGenericCoreInfo(`Checking for manifest updates across all locations...`);
    await Promise.all([evictCollectionConfigCache(), evictManifestTXTCache()]);
    const appLocations = await fetchAppCollectionConfigFromAllLocations(true);
    const allManifests = getManifestTXTFromAllLocations(appLocations, true);
    await Promise.allSettled(allManifests);
  } catch (e) {
    logGenericCoreError("Error checking for manifest updates", e);
  }
  const nextCheck = new Date().toISOString();
  logGenericCoreDebug("Setting next manifest check to", nextCheck);
  window.localStorage.setItem(CORE_MANIFEST_CHECK, nextCheck);
}
