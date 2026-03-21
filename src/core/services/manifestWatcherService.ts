import type { ManifestLocation } from "../../models/cache";
import {
  APPCOLLECTION_MANIFEST_NAME,
  WELL_KNOWN_MANIFEST_LOCATION,
} from "../../utilities/constants";
import { DEBUG_KEY_CORE } from "../../utilities/runtimeConstants";
import { getSiteAbsoluteUrl, getWebAbsoluteUrl } from "./contextService";
import { getRootCDNLocation } from "./coreConfigService";
import { getHubSiteUrl } from "./hubDataService";
import { logGenericCoreError } from "./loggingService";
import { getCollectionConfig } from "./txtAppsService";
import { getFolderManifest } from "./txtManifestService";
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
    const siteUrl = getSiteAbsoluteUrl();
    const webUrl = getWebAbsoluteUrl();
    const hubUrl = await getHubSiteUrl();
    const rootLocation = await getRootCDNLocation();
    const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
    const normalizedWebUrl = webUrl + WELL_KNOWN_MANIFEST_LOCATION;
    const webIsRoot = normalizedWebUrl.toLowerCase() === rootLocation.toLowerCase();
    // await collectionCheckForLocation(siteUrl + WELL_KNOWN_MANIFEST_LOCATION, "site");
    await collectionCheckForLocation(rootLocation, "root");
    if (hubUrl) {
      await collectionCheckForLocation(hubUrl + WELL_KNOWN_MANIFEST_LOCATION, "hub");
    }
    await collectionCheckForLocation(siteUrl + WELL_KNOWN_MANIFEST_LOCATION, "site");
    if (!siteIsWeb && !webIsRoot) {
      await collectionCheckForLocation(normalizedWebUrl, "web");
    }
  } catch (e) {
    logGenericCoreError("Error checking for manifest updates", e);
  }
}
async function collectionCheckForLocation(
  wellKnownLocation: string,
  locationType: ManifestLocation
) {
  const manifestUrl = (wellKnownLocation + APPCOLLECTION_MANIFEST_NAME).toLowerCase();
  const collectionBase = {
    url: manifestUrl,
    type: locationType,
    name: APPCOLLECTION_MANIFEST_NAME,
  };
  let cacheItem = await getCollectionConfig(collectionBase);
  const now = new Date();
  const cacheAge = new Date(cacheItem.lastCheck);
  const diff = now.getTime() - cacheAge.getTime();
  if (diff > CORE_MANIFEST_CHECK_INTERVAL) {
    cacheItem = await getCollectionConfig(collectionBase, true);
  }
  const baseUrl = cacheItem.url
    .toLowerCase()
    .replace(APPCOLLECTION_MANIFEST_NAME.toLowerCase(), "");
  for (const appFolderName of cacheItem.manifest.enabledAppCollections) {
    const folderManifest = await getFolderManifest(baseUrl, appFolderName, cacheItem.type, false);
    const folderManifestAge = new Date(folderManifest.lastCheck);
    const folderDiff = now.getTime() - folderManifestAge.getTime();
    if (folderDiff > CORE_MANIFEST_CHECK_INTERVAL) {
      await getFolderManifest(baseUrl, appFolderName, cacheItem.type, true);
    }
  }
}
