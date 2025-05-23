import { DEBUG_KEYS } from "../../utilities/debug";
import { evictAppsTXTCache, evictManifestTXTCache } from "./coreIdbService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreInfo } from "./loggingService";
import { fetchAppCollectionConfigFromAllLocations } from "./txtAppsService";
import { getManifestTXTFromAllLocations } from "./txtManifestService";
const CORE_MANIFEST_CHECK = "CORE_MANIFEST_CHECK";
const CORE_MANIFEST_CHECK_INTERVAL = Number(localStorage.getItem(DEBUG_KEYS.SPFXEXT_CORE)) > 0 ? 10000 : 90000;
let manifestWatch: number = 0;

export function registerManifestWatcher(
  site: string,
  web: string,
  hubUrl: string,
  contextChange = false
) {
  if (contextChange) {
    window.clearInterval(manifestWatch);
    manifestWatch = 0;
  }
  if (manifestWatch > 0) return;
  manifestWatch = window.setInterval(performManifestCheck, CORE_MANIFEST_CHECK_INTERVAL, site, web, hubUrl);
  //do not await, just check in background first time.
  performManifestCheck(site, web, hubUrl);
}

export async function performManifestCheck(
  site: string,
  web: string,
  hubUrl: string
) {
  try {
    const item = localStorage.getItem(CORE_MANIFEST_CHECK);
    if (item) {
      const lastCheck = new Date(item);
      const now = new Date();
      const diff = now.getTime() - lastCheck.getTime();
      const maxDiff = CORE_MANIFEST_CHECK_INTERVAL; //2 seconds buffer
      //add 2 seconds since interval is not reliable and exact
      if (diff < maxDiff) {
        logGenericCoreDebug("Manifest check already performed recently, skipping.", `${diff} < ${maxDiff}`);
        return;
      }
    }
    logGenericCoreInfo(`Checking for manifest updates across all locations...`);
    await Promise.all([evictAppsTXTCache(), evictManifestTXTCache()]);
    const appLocations = await fetchAppCollectionConfigFromAllLocations(
      site,
      web,
      hubUrl,
      true
    );
    const allManifests = getManifestTXTFromAllLocations(
      appLocations,
      true
    );
    await Promise.allSettled(allManifests);
  } catch (e) {
    logGenericCoreError("Error checking for manifest updates", e);
  }
  const nextCheck = new Date().toISOString();
  logGenericCoreDebug("Setting next manifest check to", nextCheck)
  localStorage.setItem(CORE_MANIFEST_CHECK, nextCheck);
}
