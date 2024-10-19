import {
  MANIFEST_NAME,
  ROOT_APPS_LOCATION,
  ROOT_APPS_MANIFEST_LOCATION,
  APPCOLLECTION_MANIFEST_NAME,
  WELL_KNOWN_MANIFEST_LOCATION,
  SPFxExtensionCore,
} from "../utilities/constants";
import { getContentDigest } from "../utilities/digest";
import { isFileAllowedInCurrentWeb } from "./allowedAppsService";

import { getManifestFromCache, setOrUpdateManifest } from "./idbService";
import { DEBUG_KEYS, isInDebug } from "../utilities/debug";
import type {
  AppCollectionManifest,
  AppFolderManifest,
  ManifestBase,
  ManifestCacheItem,
  ManifestItem,
  ManifestLocation,
} from "../models/cache";
import type { SPFxExtensionAppManifest } from "../models/appModel";

interface AssetPromise {
  url: string;
  promise: Promise<any>;
}

function validateAppCollectionManifest(manifest: any) {
  if (!Array.isArray(manifest)) {
    throw `${SPFxExtensionCore} App manifest should be an array of strings`;
  }
  if (
    manifest.some((v) => {
      return typeof v !== "string";
    })
  ) {
    throw `${SPFxExtensionCore} App manifest should only contain strings`;
  }
}

function validateAppManifest(manifest: any) {
  if (Array.isArray(manifest) || typeof manifest !== "object") {
    throw `${SPFxExtensionCore} App manifest has to be an object.`;
  }
  for (const key in manifest) {
    if (Object.prototype.hasOwnProperty.call(manifest, key)) {
      const element = manifest[key];
      if (!element.js) {
        throw `${SPFxExtensionCore} ${key} does not have js property.`;
      }
      if (!Array.isArray(element.js)) {
        throw `${SPFxExtensionCore} ${key} js property hast to be an array.`;
      }
    }
  }
}

function getMatchingItemIndexFromCache(
  cache: ManifestCacheItem[],
  item: ManifestBase
) {
  return cache.findIndex(
    (m) =>
      m.url.toLowerCase() === item.url.toLowerCase() &&
      m.domain.toLowerCase() === window.location.host.toLowerCase() &&
      m.isAppCollection == item.isAppCollection &&
      m.type == item.type
  );
}

function validateManifest(manifest: any, isAppCollection: boolean) {
  if (!manifest) {
    throw `${SPFxExtensionCore} Manifest supplied is undefined`;
  }
  isAppCollection
    ? validateAppCollectionManifest(manifest)
    : validateAppManifest(manifest);
}

//@param [cacheTime=3600000] use ```3600000``` to cache for one hour (3600 seconds)

/**
 * fetches Manifest from cache, and if it does not exist downloads it and caches for 3600 seconds by default
 * @param url url of the manifest to download
 * @param type type of the manifest related to sharepoint context
 *
 *  ```root``` global
 *
 * ```site``` for site collection
 *
 * ```web``` site collection subsite
 * @param [cacheTimeMinutes] Default is ```60``` to cache for one hour
 */
async function fetchAndCacheManifest(
  url: string,
  type: ManifestLocation,
  isAppCollection: boolean,
  skipCache = false,
  cacheTimeMinutes = 60
): Promise<ManifestItem> {
  let appManifest: SPFxExtensionAppManifest = {};
  let appCollection: string[] = [];

  if (!skipCache && !isInDebug) {
    let cachedManifest = await getManifestFromCache(url, isAppCollection);
    if (cachedManifest) {
      return cachedManifest;
    }
  }

  try {
    console.debug(SPFxExtensionCore, `Fetching manifest from`, url);
    const mnfReq = await fetch(url);
    const result = await mnfReq.json();
    if (isAppCollection) {
      appCollection = result;
    } else {
      appManifest = result;
    }
  } catch (err) {
    console.warn(SPFxExtensionCore, `Unable to fetch manifest from`, url, err);
  }
  try {
    validateManifest(
      isAppCollection ? appCollection : appManifest,
      isAppCollection
    );
  } catch (err) {
    console.error(SPFxExtensionCore, `Error while parsing manifest from`, url, err);
    appManifest = {};
    appCollection = [];
  }
  const hash = await getContentDigest(
    JSON.stringify(isAppCollection ? appCollection : appManifest)
  );
  const baseResult = {
    url,
    type,
    hash,
  };

  const retResult: ManifestItem = isAppCollection
    ? { appCollection, isAppCollection: true, ...baseResult }
    : { appManifest, isAppCollection: false, ...baseResult };

  await setOrUpdateManifest(retResult, isInDebug ? 1 : cacheTimeMinutes);

  return retResult;
}

async function parseManifestAndImport(
  rootManifest: SPFxExtensionAppManifest,
  cdnLoc: string
) {
  const returnPromiseArray: AssetPromise[] = [];
  for (const key in rootManifest) {
    if (Object.prototype.hasOwnProperty.call(rootManifest, key)) {
      const element = rootManifest[key];
      for (const jsUrl of element.js) {
        const fullJSUrl = `${cdnLoc}${jsUrl}`;
        console.debug(SPFxExtensionCore, `{${key}} EntryPoint JS: `, fullJSUrl);
        const isAllowed = await isFileAllowedInCurrentWeb(fullJSUrl);
        if (!isAllowed) {
          continue;
        }
        const isScriptLoaded =
          window.__SPFxExtensions.LoadedAppAssets.includes(fullJSUrl);
        if (!isScriptLoaded) {
          window.__SPFxExtensions.LoadedAppAssets.push(fullJSUrl);
          returnPromiseArray.push({
            url: fullJSUrl,
            promise: import(fullJSUrl),
          });
        }
      }
    }
  }
  return returnPromiseArray;
}

export async function fetchAppsTXTFromAllLocations(
  siteUrl: string,
  webUrl: string,
  hubUrl: string,
  skipCache = false
): Promise<AppCollectionManifest[]> {
  // all apps.txt accross the context (root / site /web)
  const allAppManifests: Promise<ManifestItem>[] = [];
  allAppManifests.push(
    fetchAndCacheManifest(
      window.location.origin + ROOT_APPS_MANIFEST_LOCATION,
      "root",
      true,
      skipCache
    )
  );

  const normalizedSiteUrl = siteUrl + WELL_KNOWN_MANIFEST_LOCATION;

  allAppManifests.push(
    fetchAndCacheManifest(
      `${normalizedSiteUrl}${APPCOLLECTION_MANIFEST_NAME}`,
      "site",
      true,
      skipCache
    )
  );

  if (hubUrl) {
    const normalizedHubUrl = hubUrl + WELL_KNOWN_MANIFEST_LOCATION;
    allAppManifests.push(
      fetchAndCacheManifest(
        `${normalizedHubUrl}${APPCOLLECTION_MANIFEST_NAME}`,
        "site",
        true,
        skipCache
      )
    );
  }

  const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  if (!siteIsWeb) {
    const normalizedWebUrl = webUrl + WELL_KNOWN_MANIFEST_LOCATION;
    allAppManifests.push(
      fetchAndCacheManifest(
        `${normalizedWebUrl}${APPCOLLECTION_MANIFEST_NAME}`,
        "web",
        true,
        skipCache
      )
    );
  }
  const manifestResult = await Promise.all(allAppManifests);

  return manifestResult as AppCollectionManifest[];
}

/***
 * @param baseUrl should be:
 *
 * Root: ```/sites/AppCatalog/CDN/SPFxExtensionApps/```
 *
 * Site: ```/sites/[SomeSite]/SPFxExtensionApps/```
 */
function GetAppManifestLocation(baseUrl: string, appKey: string) {
  const lsKey = `${DEBUG_KEYS.SPFXEXT}${appKey}`;
  const devSitePort = Number(localStorage.getItem(lsKey));
  const siteLocation = `${baseUrl}${appKey}/${MANIFEST_NAME}`;
  if (devSitePort > 0) {
    const debugLoc = `https://localhost:${devSitePort}/${MANIFEST_NAME}`;
    console.info(
      SPFxExtensionCore,
      `<${appKey}> App is in debug mode, loading from`,
      debugLoc
    );
    return debugLoc;
  }
  return siteLocation;
}

function loadWebpackManifestsTXT(
  appCollectionManifests: AppCollectionManifest[],
  skipCache = false
) {
  if (appCollectionManifests.length === 0) return [];
  const manifestPromises: Promise<ManifestItem>[] = [];
  for (const appCollectionManifest of appCollectionManifests) {
    const baseUrl = appCollectionManifest.url.replace(
      APPCOLLECTION_MANIFEST_NAME,
      ""
    );
    for (const appFolderName of appCollectionManifest.appCollection) {
      const manifestLocation = GetAppManifestLocation(baseUrl, appFolderName);
      manifestPromises.push(
        fetchAndCacheManifest(
          manifestLocation,
          appCollectionManifest.type,
          false,
          skipCache
        )
      );
    }
  }
  return manifestPromises;
}

export async function loadModernApps(
  siteUrl: string,
  webUrl: string,
  hubUrl: string
) {
  if (window.__SPFxExtensions.AppLoadInitialized) return;
  window.__SPFxExtensions.AppLoadInitialized = true;
  window.__SPFxExtensions.LoadedAppAssets = [];
  //LOAD apps.txt
  const coreCollection = await fetchAppsTXTFromAllLocations(
    siteUrl,
    webUrl,
    hubUrl
  );
  const allWebpackManifestsTXT = getWebpackManifestsFromAllLocations(
    coreCollection as AppCollectionManifest[]
  );

  window.__SPFxExtensions.Utils.appManifestPromises =
    allWebpackManifestsTXT;
  window.__SPFxExtensions.Utils.spAppInitializationPromiseResolver();

  const allWebpackManifestsTXTPromises = await Promise.allSettled(
    allWebpackManifestsTXT
  );
  const resolvedWebpackManifestsTXT = allWebpackManifestsTXTPromises.filter(
    (p) => p.status === "fulfilled"
  ) as PromiseFulfilledResult<ManifestItem>[];

  const webpackEntryPointsFromManifestTXT: Promise<AssetPromise[]>[] = [];
  const resolvedRootAppsManifests = resolvedWebpackManifestsTXT.filter(
    (m) => m.value.type === "root"
  );
  const resolvedSiteAppsManifests = resolvedWebpackManifestsTXT.filter(
    (m) => m.value.type === "site"
  );
  const resolvedWebAppsManifests = resolvedWebpackManifestsTXT.filter(
    (m) => m.value.type === "web"
  );

  //sort out so that root is first to go, that way root cannot be overriden by site and site cannot be overriden by web
  //TODO: check performance impact

  for (const rootManifestTXT of resolvedRootAppsManifests) {
    webpackEntryPointsFromManifestTXT.push(
      parseResolvedManifestTXT(
        rootManifestTXT as PromiseFulfilledResult<AppFolderManifest>
      )
    );
  }
  //wait for root stuff to load
  const rootResults = await Promise.allSettled(
    webpackEntryPointsFromManifestTXT
  );
  await Promise.allSettled(getModulePromises(rootResults));
  console.debug(SPFxExtensionCore, "Root apps loaded.");

  //wait for site stuff to load
  for (const siteManifests of resolvedSiteAppsManifests) {
    webpackEntryPointsFromManifestTXT.push(
      parseResolvedManifestTXT(
        siteManifests as PromiseFulfilledResult<AppFolderManifest>
      )
    );
  }
  const rootAndSiteResults = await Promise.allSettled(
    webpackEntryPointsFromManifestTXT
  );
  await Promise.allSettled(getModulePromises(rootAndSiteResults));
  console.debug(SPFxExtensionCore, "Site apps loaded.");

  //wait for web stuff to load
  for (const webManifests of resolvedWebAppsManifests) {
    webpackEntryPointsFromManifestTXT.push(
      parseResolvedManifestTXT(
        webManifests as PromiseFulfilledResult<AppFolderManifest>
      )
    );
  }
  const rootAndSiteAndWebResults = await Promise.allSettled(
    webpackEntryPointsFromManifestTXT
  );
  await Promise.allSettled(getModulePromises(rootAndSiteAndWebResults));
  console.debug(SPFxExtensionCore, "SiteWeb apps loaded.");

  const entryPointSettledResults = await Promise.allSettled(
    webpackEntryPointsFromManifestTXT
  );
  const fetchedEntryPoints = entryPointSettledResults.filter(
    (r) => r.status === "fulfilled"
  ) as PromiseFulfilledResult<AssetPromise[]>[];

  const assetPromises = fetchedEntryPoints.flatMap((a) => a.value);
  await Promise.allSettled(assetPromises.map((a) => a.promise));

  for (const asset of assetPromises) {
    asset.promise.catch((e) => {
      console.error(SPFxExtensionCore, `Could not load or parse asset:`, asset.url, e);
    });
  }
  window.__SPFxExtensions.AllAppAssetsLoadedResolver();
  console.info(SPFxExtensionCore, "SPFx Extensions Core Components Loaded.");
}

export function getWebpackManifestsFromAllLocations(
  coreCollection: AppCollectionManifest[],
  skipCache = false
) {
  const rootAppsCollectionManifest = coreCollection.filter(
    (app) => app.type === "root"
  );
  const rootAppPromises = loadWebpackManifestsTXT(
    rootAppsCollectionManifest,
    skipCache
  );

  const siteCollectionAppsManifest = coreCollection.filter(
    (app) => app.type === "site"
  );
  const scAppPromises = loadWebpackManifestsTXT(
    siteCollectionAppsManifest,
    skipCache
  );

  // const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  // let subsitePromises: Promise<ManifestItem>[] = [];
  // if (!siteIsWeb) {
  const webAppCollectionManifest = coreCollection.filter(
    (app) => app.type === "web"
  );
  const subsitePromises = loadWebpackManifestsTXT(
    webAppCollectionManifest,
    skipCache
  );
  //}

  //foreach app do stuff
  const allWebpackManifestsTXT = [
    ...rootAppPromises,
    ...scAppPromises,
    ...subsitePromises,
  ];
  return allWebpackManifestsTXT;
}

function getModulePromises(
  manifestResults: PromiseSettledResult<AssetPromise[]>[]
) {
  const modulePromises: Promise<any>[] = [];
  for (const manifestResult of manifestResults) {
    if (manifestResult.status === "fulfilled") {
      for (const module of manifestResult.value) {
        modulePromises.push(module.promise);
      }
    }
  }
  return modulePromises;
}

function parseResolvedManifestTXT(
  manifestTXTResult: PromiseFulfilledResult<AppFolderManifest>
) {
  const appManifestTXTResultValue = manifestTXTResult.value;
  const appBaseUrl = appManifestTXTResultValue.url.replace(MANIFEST_NAME, "");
  console.debug(
    SPFxExtensionCore,
    "Parsing",
    appManifestTXTResultValue.type,
    "manifest:",
    appManifestTXTResultValue.appManifest
  );

  return parseManifestAndImport(
    appManifestTXTResultValue.appManifest,
    appBaseUrl
  );
}
