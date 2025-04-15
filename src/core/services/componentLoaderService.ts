import type { SPFxExtensionAppRegistration } from "../../models/appModel";
import type { CacheableAppFolderManifest } from "../../models/cache";
import { CONFIGURATOR_APP_ID, MANIFEST_NAME } from "../../utilities/constants";
import { isAppInDebug } from "../../utilities/debug";
import { isFileAllowedToRun } from "./allowedAppsService";
import { unmountInstancesOnContextChange } from "./appServices";
import { getHubSiteId, getSiteId, getWebId } from "./contextService";
import {
  logGenericCoreDebug,
  logGenericCoreError,
  logGenericCoreInfo,
  logGenericCoreWarning,
} from "./loggingService";
import { fetchAppsTXTFromAllLocations } from "./txtAppsService";
import { getManifestTXTFromAllLocations } from "./txtManifestService";

interface AssetPromise {
  url: string;
  promise: Promise<SPFxExtensionAppRegistration[]>;
  manifest: CacheableAppFolderManifest;
}
let isLoaded = false;
const loadedAssets: string[] = [];

export async function importEntryPoint(fullJSUrl: string, isESM: boolean) {
  try {
    const appRegistrations = await import(fullJSUrl);
    if (!isESM) {
      logGenericCoreWarning(
        `Non ESM module detected. Make sure to call window.__SPFxExtensions.RegisterApp in code.`,
        fullJSUrl
      );
      return [];
    }
    const defaultExport =
      appRegistrations.default as SPFxExtensionAppRegistration[];
    if (!defaultExport) {
      throw `No default export found in ${fullJSUrl}, only ESM modules are supported.`;
    }
    return defaultExport;
  } catch (e) {
    logGenericCoreError(`Error while importing or executing`, fullJSUrl, e);
    throw e;
  }
}

async function parseManifestAndImportEntryPoints(
  manifestToParse: CacheableAppFolderManifest
) {
  const returnPromiseArray: AssetPromise[] = [];
  const cdnLoc = manifestToParse.url.replace(MANIFEST_NAME, "");

  logGenericCoreDebug(
    "Parsing",
    manifestToParse.type,
    "manifest:",
    manifestToParse.manifest
  );

  for (const entryUrl of manifestToParse.manifest.appRelativeEntryPointUrls) {
    const ep = entryUrl.replace(/\.\.\/?/g, "./");
    const fullJSUrl = `${cdnLoc}${ep}`.toLowerCase();

    logGenericCoreDebug(`EntryPoint JS: `, fullJSUrl);
    const jsUrl = new URL(fullJSUrl);
    if (
      manifestToParse.manifest.cacheString &&
      manifestToParse.manifest.enableCaching
    ) {
      const cacheString = isAppInDebug(manifestToParse.name)
        ? `${new Date().getTime()}`
        : manifestToParse.manifest.cacheString;
      jsUrl.searchParams.set("v", `${cacheString}`);
    }
    // if()
    const isAllowed = await isFileAllowedToRun(jsUrl, manifestToParse.name);
    if (!isAllowed) {
      continue;
    }

    // if non esm do additional checks here
    if(!manifestToParse.manifest.isESM) {
      const foundNonESMAppConfig = manifestToParse.manifest.appDefinitionMap.find(a=>a.appId === entryUrl);
      if(!foundNonESMAppConfig) {
        logGenericCoreError(`Could not find app configuration item for non ESM app`, manifestToParse.name, entryUrl);
        continue;
      }
    }





    const plainUrl = `${jsUrl.origin}${jsUrl.pathname}`;
    const urlWithCache = `${jsUrl}`;
    const isScriptLoaded = loadedAssets.includes(plainUrl);
    if (!isScriptLoaded) {
      loadedAssets.push(plainUrl);
      returnPromiseArray.push({
        url: urlWithCache,
        promise: importEntryPoint(urlWithCache, manifestToParse.manifest.isESM),
        manifest: manifestToParse,
      });
    } else {
      logGenericCoreInfo(`EntryPoint already loaded:`, urlWithCache);
    }
  }

  return returnPromiseArray;
}
export async function loadModernApps(
  siteUrl: string,
  webUrl: string,
  hubUrl: string,
  contextId: string,
  contextChange = false
) {
  if (contextChange) {
    handleContextChange(contextId);
  }
  if (isLoaded) return;
  isLoaded = true;
  // window.__SPFxExtensions.LoadedAppAssets = [];
  //LOAD collectionConfig.txt
  const coreCollection = await fetchAppsTXTFromAllLocations(
    siteUrl,
    webUrl,
    hubUrl
  );
  const allManifestTXTs = getManifestTXTFromAllLocations(coreCollection);

  window.__SPFxExtensions.Utils.appManifestPromises = allManifestTXTs;
  window.__SPFxExtensions.Utils.spAppInitializationPromiseResolver();

  const allManifestTXTsPromises = await Promise.allSettled(allManifestTXTs);
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
      parseManifestAndImportEntryPoints(rootManifestTXT.value)
    );
  }
  //wait for root stuff to load
  const rootResults = await Promise.allSettled(entryPointsFromManifestTXTs);
  await Promise.allSettled(getModulePromises(rootResults));
  logGenericCoreDebug("Root apps loaded.");

  //wait for site stuff to load
  for (const siteManifests of resolvedSiteAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseManifestAndImportEntryPoints(siteManifests.value)
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
      parseManifestAndImportEntryPoints(webManifests.value)
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
  );

  const assetPromises = fetchedEntryPoints.flatMap((a) => a.value);
  const allExportsSettled = await Promise.allSettled(
    assetPromises.map((a) => a.promise)
  );
  const allExports = allExportsSettled
    .filter((a) => a.status === "fulfilled")
    .flatMap((a) => a.value);
  await unregisterNonApplicable(allExports);

  const successfullyRegistered: SPFxExtensionAppRegistration[] = [];
  for (const asset of assetPromises) {
    try {
      const exports = await asset.promise;
      if (!asset.manifest.manifest.isESM) {
        continue;
      }
      successfullyRegistered.push(
        ...(await executeRegistration(exports, asset.manifest, asset.url))
      );
    } catch (e) {
      logGenericCoreError(`Could not load or parse manifest.`, e);
    }
  }
  //unregister any remaining app definitions that are not applicable to this context
  await unregisterNonApplicable(successfullyRegistered);
  window.__SPFxExtensions.AllAppAssetsLoadedResolver();
  logGenericCoreInfo("SPFx Extensions Core Components Loaded.");
}

function handleContextChange(contextId: string) {
  isLoaded = false;
  loadedAssets.splice(0, loadedAssets.length);
  unmountInstancesOnContextChange(contextId);
  const { promise: assetPromise, resolve: assetPromiseResolver } =
    Promise.withResolvers<void>();
  window.__SPFxExtensions.AllAppAssetsLoadedPromise = assetPromise;
  window.__SPFxExtensions.AllAppAssetsLoadedResolver = assetPromiseResolver;
}

async function unregisterNonApplicable(
  allExports: SPFxExtensionAppRegistration[]
) {
  for (const alreadyRegisteredApp of window.__SPFxExtensions.Apps) {
    const foundApp = allExports.find((a) => a.id === alreadyRegisteredApp.id);
    if (!foundApp && alreadyRegisteredApp.id !== CONFIGURATOR_APP_ID) {
      //unregister app as it does not belong to this context
      const unregistered = await window.__SPFxExtensions.UnregisterApp(
        alreadyRegisteredApp.id
      );
      if (unregistered) {
        logGenericCoreWarning(
          `Unregistered app as it does not belong in this context`,
          alreadyRegisteredApp.id,
          alreadyRegisteredApp.name
        );
      }
    }
  }
}

async function executeRegistration(
  registrations: SPFxExtensionAppRegistration[],
  manifestToParse: CacheableAppFolderManifest,
  fullJSUrl: string
) {
  // const isHub = getIsHubSite();
  const currentWebId = getWebId().toLowerCase();
  const currentSiteId = getSiteId().toLowerCase();
  const currentHubId = getHubSiteId().toLowerCase();

  if (!Array.isArray(registrations)) {
    logGenericCoreError(
      `Default export of entry point should be an array of App definitions. TODO: add documentation url`,
      fullJSUrl
    );
  }
  const successfullyRegistered: SPFxExtensionAppRegistration[] = [];
  for (const appReg of registrations) {
    if (!appReg.id) {
      logGenericCoreError(
        `App definition does not have an id. Make sure that returned array is in proper format. TODO: add documentation url`,
        fullJSUrl,
        appReg
      );
      continue;
    }
    const foundMapItem = manifestToParse.manifest.appDefinitionMap.find(
      (a) => a.appId.toLowerCase() === appReg.id.toLowerCase()
    );
    const notEnabledMSG = `App with id ${appReg.id} ${appReg.name} is not enabled for current web. Skipping...`;
    if (!foundMapItem) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }
    const isEnabledEverywhere = foundMapItem.config.enabledEverywhere;
    const appEnabled = isEnabledEverywhere ? 
    foundMapItem.config.excludedIds.indexOf(currentWebId) === -1 &&
    foundMapItem.config.excludedIds.indexOf(currentSiteId) === -1 &&
    foundMapItem.config.excludedIds.indexOf(currentHubId) === -1 : true;

    if (!appEnabled) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }
    window.__SPFxExtensions.RegisterApp(appReg);
    successfullyRegistered.push(appReg);
    if (!appReg.isWebPartApp && appReg.autoExecute) {
      window.__SPFxExtensions.InstantiateApp(appReg.id, {});
    }
  }
  return successfullyRegistered;
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
