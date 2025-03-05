import {
  EMPTY_APP_MANIFEST,
  SPFX_EXTENSIONS_DATA_SITE,
  SPFxExtensionCore,
} from "../../utilities/constants";
import { getContentDigest } from "../../utilities/digest";
import { isFileAllowedToRun } from "./allowedAppsService";

import type { SPFxExtensionAppManifest } from "../../models/appCollectionManifest";
import type { SPFxExtensionAppRegistration } from "../../models/appModel";
import type {
  AppCollectionManifest,
  AppFolderManifest,
  ManifestItem,
  ManifestLocation,
} from "../../models/cache";
import { APPCOLLECTION_MANIFEST_NAME, MANIFEST_NAME, WELL_KNOWN_MANIFEST_LOCATION } from "../../utilities/constants";
import { DEBUG_KEYS, isAppInDebug, isInDebug } from "../../utilities/debug";
import { GetCacheStringForAsset } from "./browserCache";
import { currentSiteIsRootHub, getWebId } from "./contextService";
import { getRootCDNLocation } from "./coreConfigService";
import { getManifestFromCache, setOrUpdateManifest } from "./coreIdbService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreInfo, logGenericCoreWarning } from "./loggingService";

interface AssetPromise {
  url: string;
  promise: Promise<SPFxExtensionAppRegistration[]>;
  manifest: AppFolderManifest;
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

function validateAppManifest(manifest: SPFxExtensionAppManifest) {
  if (Array.isArray(manifest) || typeof manifest !== "object") {
    throw `${SPFxExtensionCore} App manifest has to be an object.`;
  }

  if (!manifest.appRelativeEntryPointUrls) {
    logGenericCoreError(`Manifest does not have appRelativeEntryPointUrl property.`, manifest);
    throw `${SPFxExtensionCore} Manifest does not have appRelativeEntryPointUrl property.`;

  }
  if (!manifest.enabledApps) {
    logGenericCoreError(`Manifest does not have enabledApps property.`, manifest);
    throw `${SPFxExtensionCore} Manifest does not have enabledApps property.`;
  }
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
async function fetchAndCacheTXT(
  url: string,
  name: string,
  type: ManifestLocation,
  isAppCollection: boolean,
  isHubFetch: boolean,
  skipCache = false,
  cacheTimeMinutes = 60
): Promise<ManifestItem> {
  let appManifest = { ...EMPTY_APP_MANIFEST };
  let appCollection: string[] = [];
  let fetchLocation = url.toLowerCase();
  if (!skipCache && !isInDebug) {
    let cachedManifest = await getManifestFromCache(fetchLocation, isAppCollection);
    if (cachedManifest) {
      cachedManifest.isHubFetch = isHubFetch;
      return cachedManifest;
    }
  }
  try {
    logGenericCoreDebug(`Fetching manifest from`, fetchLocation);
    const mnfReq = await fetch(fetchLocation);
    const result = await mnfReq.json();
    if (isAppCollection) {
      appCollection = result;
    } else {
      appManifest = result;
    }
  } catch (err) {
    logGenericCoreWarning(`Unable to fetch manifest from`, fetchLocation, err);
  }
  try {
    validateManifest(
      isAppCollection ? appCollection : appManifest,
      isAppCollection
    );
  } catch (err) {
    logGenericCoreError(`Error while parsing manifest from`, fetchLocation, err);
    appManifest = { ...EMPTY_APP_MANIFEST };
    appCollection = [];
  }
  const hash = await getContentDigest(
    JSON.stringify(isAppCollection ? appCollection : appManifest)
  );
  const baseResult = {
    name,
    url: fetchLocation,
    type,
    hash,
  };

  const retResult: ManifestItem = isAppCollection
    ? { appCollection, isAppCollection: true, ...baseResult }
    : { appManifest, isAppCollection: false, ...baseResult };

  await setOrUpdateManifest(retResult, isInDebug ? 1 : cacheTimeMinutes);
  retResult.isHubFetch = isHubFetch;
  return retResult;
}

export async function importEntryPoint(fullJSUrl: string, isESM: boolean) {

  try {
    const appRegistrations = await import(fullJSUrl);
    if (!isESM) {
      logGenericCoreWarning(`Non ESM module detected. Make sure to call window.__SPFxExtensions.RegisterApp in code.`, fullJSUrl);
      return [];
    }
    const defaultExport = appRegistrations.default as SPFxExtensionAppRegistration[];
    if (!defaultExport) {
      throw `No default export found in ${fullJSUrl}, only ESM modules are supported.`;
    }
    return defaultExport;
  }
  catch (e) {
    logGenericCoreError(`Error while importing or executing`, fullJSUrl, e);
    throw e
  }
}

async function parseManifestAndImportEntryPoints(
  manifestToParse: AppFolderManifest,
) {
  const returnPromiseArray: AssetPromise[] = [];
  const cdnLoc = manifestToParse.url.replace(MANIFEST_NAME, "");

  logGenericCoreDebug(
    "Parsing",
    manifestToParse.type,
    "manifest:",
    manifestToParse.appManifest
  );
  if (!manifestToParse.appManifest.enabled) {
    return returnPromiseArray;
  }
  for (const entryUrl of manifestToParse.appManifest.appRelativeEntryPointUrls) {
    const ep = entryUrl.replace(/\.\.\/?/g, "asdasd");
    const fullJSUrl = `${cdnLoc}${ep}`.toLowerCase();


    logGenericCoreDebug(`EntryPoint JS: `, fullJSUrl);
    const jsUrl = new URL(fullJSUrl);
    if (manifestToParse.appManifest.cacheString && manifestToParse.appManifest.enableCaching) {
      const cacheString = isAppInDebug(manifestToParse.name) ? `${(new Date()).getTime()}` : manifestToParse.appManifest.cacheString
      jsUrl.searchParams.set("v", `${cacheString}`);
    }
    // if()
    const isAllowed = await isFileAllowedToRun(jsUrl);
    if (!isAllowed) {
      continue;
    }
    const plainUrl = `${jsUrl.origin}${jsUrl.pathname}`;
    const urlWithCache = `${jsUrl}`;
    const isScriptLoaded =
      window.__SPFxExtensions.LoadedAppAssets.includes(plainUrl);
    if (!isScriptLoaded) {
      window.__SPFxExtensions.LoadedAppAssets.push(plainUrl);
      returnPromiseArray.push({
        url: urlWithCache,
        promise: importEntryPoint(urlWithCache, manifestToParse.appManifest.isESM),
        manifest: manifestToParse
      });
    } else {
      logGenericCoreInfo(`EntryPoint already loaded:`, urlWithCache);
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
  const rootLocation = await getRootCDNLocation();
  // const rootUrl = `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}`;
  allAppManifests.push(
    fetchAndCacheTXT(
      rootLocation,
      "apps",
      // rootUrl,
      "root",
      true,
      true,
      skipCache
    )
  );

  const normalizedSiteUrl = siteUrl + WELL_KNOWN_MANIFEST_LOCATION;

  allAppManifests.push(
    fetchAndCacheTXT(
      `${normalizedSiteUrl}${APPCOLLECTION_MANIFEST_NAME}`,
      "apps",
      // siteUrl,
      "site",
      true,
      false,
      skipCache
    )
  );

  if (hubUrl) {
    const normalizedHubUrl = hubUrl + WELL_KNOWN_MANIFEST_LOCATION;
    allAppManifests.push(
      fetchAndCacheTXT(
        `${normalizedHubUrl}${APPCOLLECTION_MANIFEST_NAME}`,
        "apps",
        // hubUrl,
        "site",
        true,
        true,
        skipCache
      )
    );
  }

  const normalizedWebUrl = webUrl + WELL_KNOWN_MANIFEST_LOCATION;
  const fullWebUrl = `${normalizedWebUrl}${APPCOLLECTION_MANIFEST_NAME}`;
  const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  const webIsRoot = fullWebUrl.toLowerCase() === rootLocation.toLowerCase();
  if (!siteIsWeb && !webIsRoot) {
    allAppManifests.push(
      fetchAndCacheTXT(
        fullWebUrl,
        "apps",
        // webUrl,
        "web",
        true,
        false,
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
 * Root: ```/sites/appcatalog/CDN/SPFxExtensionApps/```
 *
 * Site: ```/sites/[SomeSite]/SPFxExtensionApps/```
 */
function GetAppManifestLocation(baseUrl: string, appKey: string) {
  const siteLocation = `${baseUrl}${appKey}/${MANIFEST_NAME}`;
  const lsKey = `${DEBUG_KEYS.SPFXEXT}${appKey}`;
  const devSitePort = Number(localStorage.getItem(lsKey));
  if (devSitePort > 0) {
    const debugLoc = `https://localhost:${devSitePort}/${MANIFEST_NAME}`;
    logGenericCoreInfo(
      `<${appKey}> App is in debug mode, loading from`,
      debugLoc
    );
    return debugLoc;
  }
  return siteLocation;
}

function loadAppFolderManifestTXT(
  appCollectionManifests: AppCollectionManifest[],
  skipCache = false
) {
  if (appCollectionManifests.length === 0) return [];
  const manifestPromises: Promise<AppFolderManifest>[] = [];
  for (const appCollectionManifest of appCollectionManifests) {
    const baseUrl = appCollectionManifest.url.replace(
      APPCOLLECTION_MANIFEST_NAME,
      ""
    );
    for (const appFolderName of appCollectionManifest.appCollection) {
      const manifestLocation = GetAppManifestLocation(baseUrl, appFolderName);
      manifestPromises.push(fetchAndCacheTXT(
        manifestLocation,
        appFolderName,
        appCollectionManifest.type,
        false,
        appCollectionManifest.isHubFetch ?? false,
        skipCache
      ) as Promise<AppFolderManifest>);
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
  const allManifestTXTs = getManifestTXTFromAllLocations(coreCollection);

  window.__SPFxExtensions.Utils.appManifestPromises =
    allManifestTXTs
  window.__SPFxExtensions.Utils.spAppInitializationPromiseResolver();

  const allManifestTXTsPromises = await Promise.allSettled(
    allManifestTXTs
  );
  const resolvedManifestTXTs = allManifestTXTsPromises.filter(
    (p) => p.status === "fulfilled"
  );

  const entryPointsFromManifestTXTs: Promise<AssetPromise[]>[] = [];
  const resolvedRootAppsManifests = resolvedManifestTXTs.filter(
    (m) => m.value.type === "root"
  );
  const resolvedSiteAppsManifests = resolvedManifestTXTs.filter(
    (m) => m.value.type === "site"
  );
  const resolvedWebAppsManifests = resolvedManifestTXTs.filter(
    (m) => m.value.type === "web"
  );

  //sort out so that root is first to go, that way root cannot be overriden by site and site cannot be overriden by web
  //TODO: check performance impact

  for (const rootManifestTXT of resolvedRootAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseManifestAndImportEntryPoints(
        rootManifestTXT.value
      )
    );
  }
  //wait for root stuff to load
  const rootResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootResults));
  logGenericCoreDebug("Root apps loaded.");

  //wait for site stuff to load
  for (const siteManifests of resolvedSiteAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseManifestAndImportEntryPoints(
        siteManifests.value
      )
    );
  }
  const rootAndSiteResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootAndSiteResults));
  logGenericCoreDebug("Site apps loaded.");

  //wait for web stuff to load
  for (const webManifests of resolvedWebAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseManifestAndImportEntryPoints(
        webManifests.value
      )
    );
  }
  const rootAndSiteAndWebResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootAndSiteAndWebResults));
  logGenericCoreDebug("SiteWeb apps loaded.");

  const entryPointSettledResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );

  //there will be no rejected results as this returns always an array of promises
  const fetchedEntryPoints = entryPointSettledResults.filter(
    (r) => r.status === "fulfilled"
  )

  const assetPromises = fetchedEntryPoints.flatMap((a) => a.value);
  await Promise.allSettled(assetPromises.map((a) => a.promise));

  for (const asset of assetPromises) {
    try {
      const exports = await asset.promise;
      if (!asset.manifest.appManifest.isESM) {
        continue;
      }
      await executeRegistration(exports, asset.manifest, asset.url);
    }
    catch (e) {
      logGenericCoreError(`Could not load or parse manifest.`, e);
    }
  }
  window.__SPFxExtensions.AllAppAssetsLoadedResolver();
  logGenericCoreInfo("SPFx Extensions Core Components Loaded.");
}

async function executeRegistration(registrations: SPFxExtensionAppRegistration[], manifestToParse: AppFolderManifest, fullJSUrl: string) {
  const isHub = currentSiteIsRootHub();
  const currentWebId = getWebId();

  if (!Array.isArray(registrations)) {
    logGenericCoreError(`Default export of entry point should be an array of App definitions. TODO: add documentation url`, fullJSUrl);
  }
  for (const appReg of registrations) {
    if (!appReg.id) {
      logGenericCoreError(`App definition does not have an id. Make sure that returned array is in proper format. TODO: add documentation url`, fullJSUrl, appReg);
      continue;
    }
    const appEnabled = manifestToParse.appManifest.enabledApps.some((ea) => {
      const isSameWebId = ea.webId.toLowerCase() === currentWebId.toLowerCase();
      const allWebsEnabled = ea.webId === "*";
      const isEnabledAppId = ea.enabledAppIds.some((eai) => eai.toLowerCase() === appReg.id.toLowerCase());
      const allAppsEnabled = ea.enabledAppIds.some((eai) => eai === "*");
      return (isSameWebId && isEnabledAppId) ||
        (isSameWebId && allAppsEnabled) ||
        (allWebsEnabled && allAppsEnabled) ||
        (allWebsEnabled && isEnabledAppId);
    }) || isHub || (manifestToParse.isHubFetch && manifestToParse.appManifest.enabledOnAllHubSites);

    if (!appEnabled) {
      logGenericCoreInfo(`App with id ${appReg.id} ${appReg.name} is not enabled for current web. Skipping...`);
      continue;
    }
    window.__SPFxExtensions.RegisterApp(appReg);
    if (!appReg.isWebPartApp) {
      window.__SPFxExtensions.LoadApp(appReg.id, {});
    }
  }
}

export function getManifestTXTFromAllLocations(
  coreCollection: AppCollectionManifest[],
  skipCache = false
) {
  const rootAppsCollectionManifest = coreCollection.filter(
    (app) => app.type === "root"
  );
  const rootAppPromises = loadAppFolderManifestTXT(
    rootAppsCollectionManifest,
    skipCache
  );

  const siteCollectionAppsManifest = coreCollection.filter(
    (app) => app.type === "site"
  );
  const scAppPromises = loadAppFolderManifestTXT(
    siteCollectionAppsManifest,
    skipCache
  );

  // const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  // let subsitePromises: Promise<ManifestItem>[] = [];
  // if (!siteIsWeb) {
  const webAppCollectionManifest = coreCollection.filter(
    (app) => app.type === "web"
  );
  const subsitePromises = loadAppFolderManifestTXT(
    webAppCollectionManifest,
    skipCache
  );
  //}

  //foreach app do stuff
  const allManifestsTXT = [
    ...rootAppPromises,
    ...scAppPromises,
    ...subsitePromises,
  ];
  return allManifestsTXT;
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

