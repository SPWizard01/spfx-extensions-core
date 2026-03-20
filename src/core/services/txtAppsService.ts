import type { SPFxExtensionCollectionManifest } from "../../models/appCollectionManifest";
import type {
  CacheableAppCollectionManifest,
  ManifestBase,
  ManifestLocation,
} from "../../models/cache";
import {
  APPCOLLECTION_MANIFEST_NAME,
  EMPTY_COLLECTION_MANIFEST,
  SPFxExtensionCore,
  WELL_KNOWN_MANIFEST_LOCATION,
} from "../../utilities/constants";
import { somethingIsInDebug } from "../../utilities/debug";
import { getContentDigest } from "../../utilities/digest";
import { getSiteAbsoluteUrl, getWebAbsoluteUrl } from "./contextService";
import { getRootCDNLocation } from "./coreConfigService";
import { getCollectionConfigFromCache, setOrUpdateAppCollectionTXT } from "./coreIdbService";
import { getHubSiteUrl } from "./hubDataService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreWarning } from "./loggingService";

function validateCollectionConfig(manifest: SPFxExtensionCollectionManifest) {
  if (!Array.isArray(manifest.enabledAppCollections)) {
    throw `${SPFxExtensionCore} ${APPCOLLECTION_MANIFEST_NAME} enabledAppCollections should be an array`;
  }

  if (!Array.isArray(manifest.urlMap)) {
    throw `${SPFxExtensionCore} ${APPCOLLECTION_MANIFEST_NAME} urlMap should be an array`;
  }
}

async function fetchAndCacheCollectionConfig(
  partialManifest: Omit<ManifestBase, "hash">,
  skipCache = false,
  cacheTimeMinutes = 60
): Promise<CacheableAppCollectionManifest> {
  let appCollection = EMPTY_COLLECTION_MANIFEST;
  const fetchLocation = partialManifest.url.toLowerCase();
  const isHub = partialManifest.type === "hub";
  if (!skipCache && !somethingIsInDebug) {
    const cachedManifest = await getCollectionConfigFromCache(fetchLocation);
    if (cachedManifest) {
      //hub is arbitrary value because it is also a site collection, so we want to save it as site but preserve hub value for priority loading
      cachedManifest.type = isHub ? "hub" : cachedManifest.type;
      return cachedManifest;
    }
  }
  const fetchUrl = `${fetchLocation}?v=${Date.now()}`;
  try {
    logGenericCoreDebug(`Fetching ${APPCOLLECTION_MANIFEST_NAME} from`, fetchUrl);
    const mnfReq = await fetch(fetchUrl);
    const result = await mnfReq.text();
    appCollection = JSON.parse(result);
  } catch (err) {
    logGenericCoreWarning(`Unable to fetch ${APPCOLLECTION_MANIFEST_NAME} from`, fetchUrl);
  }
  try {
    validateCollectionConfig(appCollection);
  } catch (err) {
    logGenericCoreError(`Error while parsing ${APPCOLLECTION_MANIFEST_NAME} from`, fetchUrl, err);
    appCollection = EMPTY_COLLECTION_MANIFEST;
  }
  const hash = await getContentDigest(JSON.stringify(appCollection));
  const baseResult = {
    ...partialManifest,
    url: fetchLocation,
    //save it as site collection since hub is also site collection and we want to preserve that info.
    type: isHub ? "site" : partialManifest.type,
    hash,
  };

  const retResult: CacheableAppCollectionManifest = { manifest: appCollection, ...baseResult };
  await setOrUpdateAppCollectionTXT(retResult, somethingIsInDebug ? 1 : cacheTimeMinutes);
  //return original value
  retResult.type = isHub ? "hub" : retResult.type;
  return retResult;
}

export async function fetchAppCollectionConfigFromAllLocations(skipCache = false) {
  const siteUrl = getSiteAbsoluteUrl();
  const webUrl = getWebAbsoluteUrl();
  const hubUrl = await getHubSiteUrl();
  // all collectionconfig.txt accross the context (root / site /web)
  const allAppManifests: Promise<CacheableAppCollectionManifest>[] = [];
  const rootLocation = await getRootCDNLocation();
  const rootManifest: Omit<ManifestBase, "hash"> = getCollectionConfigBase(rootLocation, "root");
  allAppManifests.push(fetchAndCacheCollectionConfig(rootManifest, skipCache));
  if (hubUrl) {
    const normalizedHubUrl = hubUrl + WELL_KNOWN_MANIFEST_LOCATION;
    const hubManifest = getCollectionConfigBase(normalizedHubUrl, "hub");
    allAppManifests.push(fetchAndCacheCollectionConfig(hubManifest, skipCache));
  }

  const normalizedSiteUrl = siteUrl + WELL_KNOWN_MANIFEST_LOCATION;
  const siteManifest = getCollectionConfigBase(normalizedSiteUrl, "site");
  allAppManifests.push(fetchAndCacheCollectionConfig(siteManifest, skipCache));

  const normalizedWebUrl = webUrl + WELL_KNOWN_MANIFEST_LOCATION;
  const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  const webIsRoot = normalizedWebUrl.toLowerCase() === rootLocation.toLowerCase();
  if (!siteIsWeb && !webIsRoot) {
    const webManifest = getCollectionConfigBase(normalizedWebUrl, "web");
    allAppManifests.push(fetchAndCacheCollectionConfig(webManifest, skipCache));
  }
  const manifestResult = await Promise.all(allAppManifests);

  return manifestResult;
}
function getCollectionConfigBase(
  normalizedUrl: string,
  location: ManifestLocation
): Omit<ManifestBase, "hash"> {
  return {
    url: `${normalizedUrl}${APPCOLLECTION_MANIFEST_NAME}`,
    name: APPCOLLECTION_MANIFEST_NAME,
    type: location,
  };
}
