import { SPFxExtensionCore } from "../../utilities/constants";
import {
  fetchAppsTXTFromAllLocations,
  getManifestTXTFromAllLocations,
} from "./componentLoaderService";
import { evictManifestCache } from "./coreIdbService";
const CORE_MANIFEST_CHECK = "CORE_MANIFEST_CHECK";
const CORE_MANIFEST_CHECK_INTERVAL = 60000;
let manifestWatch = 0;
let fistTimeChecked = false;
function getRandomArbitrary(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

export function registerManifestWatcher(
  site: string,
  web: string,
  hubUrl: string
) {
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
    const item = sessionStorage.getItem(CORE_MANIFEST_CHECK);
    if (item) {
      const lastCheck = new Date(item);
      const now = new Date();
      const diff = now.getTime() - lastCheck.getTime();
      if (diff < CORE_MANIFEST_CHECK_INTERVAL) {
        return;
      }
    }
  } catch (e) {
    sessionStorage.setItem(CORE_MANIFEST_CHECK, new Date().toISOString());
  }
  try {
    console.info(
      SPFxExtensionCore,
      new Date().toISOString(),
      `Checking for manifest updates across all locations...`
    );
    await Promise.all([evictManifestCache(true), evictManifestCache(false)]);
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
    sessionStorage.setItem(CORE_MANIFEST_CHECK, new Date().toISOString());
  } catch (e) {
    console.error(SPFxExtensionCore, "Error checking for manifest updates", e);
  }
}
