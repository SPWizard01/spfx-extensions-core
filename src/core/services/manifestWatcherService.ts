import { evictAppsTXTCache, evictManifestTXTCache } from "./coreIdbService";
import { logGenericCoreError, logGenericCoreInfo } from "./loggingService";
import { fetchAppsTXTFromAllLocations } from "./txtAppsService";
import { getManifestTXTFromAllLocations } from "./txtManifestService";
const CORE_MANIFEST_CHECK = "CORE_MANIFEST_CHECK";
const CORE_MANIFEST_CHECK_INTERVAL = 60000;
let manifestWatch = 0;
let fistTimeChecked = false;

export function registerManifestWatcher(
  site: string,
  web: string,
  hubUrl: string,
  contextChange = false
) {
  if (contextChange) {
    window.clearInterval(manifestWatch);
    manifestWatch = 0;
    fistTimeChecked = false;
  }
  if (manifestWatch) return;
  if (!fistTimeChecked) {
    //do not await, just check in background first time.
    performManifestCheck(site, web, hubUrl);
    fistTimeChecked = true;
  }
  //60 -120 sec
  // const rnd = getRandomArbitrary(60000, 120000);
  manifestWatch = window.setInterval(async () => {
    await performManifestCheck(site, web, hubUrl);
    window.clearInterval(manifestWatch);
    manifestWatch = 0;
    registerManifestWatcher(site, web, hubUrl);
  }, CORE_MANIFEST_CHECK_INTERVAL);
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
      if (diff < CORE_MANIFEST_CHECK_INTERVAL) {
        return;
      }
    }
  } catch (_e) {
    localStorage.setItem(CORE_MANIFEST_CHECK, new Date().toISOString());
  }
  try {
    logGenericCoreInfo(
      new Date().toISOString(),
      `Checking for manifest updates across all locations...`
    );
    await Promise.all([evictAppsTXTCache(), evictManifestTXTCache()]);
    const appLocations = await fetchAppsTXTFromAllLocations(
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
    localStorage.setItem(CORE_MANIFEST_CHECK, new Date().toISOString());
  } catch (e) {
    logGenericCoreError("Error checking for manifest updates", e);
  }
}
