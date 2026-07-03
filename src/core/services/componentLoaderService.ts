import type {
  SPFxExtensionAppDefinitionConfig,
  SPFxExtensionFolderManifest,
} from "../../models/appFolderManifest";
import type { SPFxExtensionAppRegistration } from "../../models/appModel";
import type { CacheableAppFolderManifest } from "../../models/cache";
import { toPublicCdnUrl } from "../../utilities/cdn";
import { CONFIGURATOR_APP_ID, MANIFEST_NAME } from "../../utilities/constants";
import { appIsInDebug } from "../../utilities/debug";
import { getNewContext } from "../../utilities/helpers";
import { isFileAllowedToRun } from "./allowedAppsService";
import { unmountInstancesOnContextChange } from "./appServices";
import { getHubSiteId, getSiteId, getWebId } from "./contextService";
import {
  logGenericCoreDebug,
  logGenericCoreError,
  logGenericCoreInfo,
  logGenericCoreWarning,
} from "./loggingService";
import { fetchAppCollectionConfigFromAllLocations } from "./txtAppsService";
import { getManifestTXTFromAllLocations } from "./txtManifestService";

let isLoaded = false;
const loadedAssets: string[] = [];

export async function importManualEntriesAndExecute(
  fullJSUrl: string,
  appId: string,
  manifest: SPFxExtensionFolderManifest
) {
  const foundNonESMAppConfig = manifest.appDefinitionMap.find((a) => a.appId === appId);
  if (!foundNonESMAppConfig) {
    const error = `Could not find app configuration item for Manual app ${appId}`;
    logGenericCoreError(error);
    return [];
  }
  const isEnabled = isEntryEnabledInCurrentContext(foundNonESMAppConfig);
  if (!isEnabled) {
    logGenericCoreInfo(`App ${appId} is not enabled in current context. Skipping...`);
    return [];
  }
  try {
    logGenericCoreWarning(
      `Manual module detected. Make sure to call window.__SPFxExtensions.RegisterApp and window.__SPFxExtensions.InstantiateApp in code.`,
      fullJSUrl
    );
    await import(fullJSUrl);
  } catch (e) {
    const error = `Error while importing or executing ${fullJSUrl} ${e}`;
    logGenericCoreError(error);
  }
  return [];
}

export async function importEntryPointsAndExecute(
  fullJSUrl: string,
  manifest: SPFxExtensionFolderManifest
) {
  try {
    const appRegistrations = await import(fullJSUrl);
    const defaultExport = appRegistrations.default as SPFxExtensionAppRegistration[];
    if (!defaultExport) {
      logGenericCoreError(
        `No default export found in ${fullJSUrl}, only ESM modules are supported.`
      );
      return [];
    }
    return executeRegistrations(defaultExport, manifest, fullJSUrl);
  } catch (e) {
    logGenericCoreError(`Error while importing or executing`, fullJSUrl, e);
    return [];
  }
}

async function checkFileAndGetExecutablePromise(
  entryUrl: string,
  cdnLoc: string,
  cacheString: string,
  manifestToParse: CacheableAppFolderManifest,
  manualAppId?: string
) {
  const ep = entryUrl.replace(/\.\.\/?/g, "./").replace(/^\.\//, "");
  const fullJSUrl = `${cdnLoc}${ep}`.toLowerCase();

  logGenericCoreDebug(`EntryPoint JS: `, fullJSUrl);
  const jsUrl = new URL(fullJSUrl);
  if (cacheString) {
    jsUrl.searchParams.set("v", `${cacheString}`);
  }
  const isAllowed = await isFileAllowedToRun(jsUrl, manifestToParse.name);
  if (!isAllowed) {
    return;
  }
  const resolvedUrl = manifestToParse.manifest.usePublicCDN ? toPublicCdnUrl(jsUrl) : jsUrl;
  const plainUrl = `${resolvedUrl.origin}${resolvedUrl.pathname}`;
  const urlWithCache = `${resolvedUrl}`;
  const isScriptLoaded = loadedAssets.includes(plainUrl);
  if (isScriptLoaded) {
    logGenericCoreInfo(`EntryPoint already loaded:`, urlWithCache);
    return;
  }
  loadedAssets.push(plainUrl);
  return () => {
    if (manualAppId) {
      return importManualEntriesAndExecute(urlWithCache, manualAppId, manifestToParse.manifest);
    }
    return importEntryPointsAndExecute(urlWithCache, manifestToParse.manifest);
  };
}

async function parseManifestAndImportEntryPoints(manifestToParse: CacheableAppFolderManifest) {
  const returnPromiseArray: Promise<SPFxExtensionAppRegistration[]>[] = [];
  const cdnLoc = manifestToParse.url.replace(MANIFEST_NAME, "");

  logGenericCoreDebug("Parsing", manifestToParse.type, "manifest:", manifestToParse.manifest);
  let cacheString = "";
  if (manifestToParse.manifest.cacheString && manifestToParse.manifest.enableCaching) {
    cacheString = appIsInDebug(manifestToParse.name)
      ? `${new Date().getTime()}`
      : manifestToParse.manifest.cacheString;
  }
  for (const entryUrl of manifestToParse.manifest.appRelativeEntryPointUrls) {
    const executablePromise = await checkFileAndGetExecutablePromise(
      entryUrl,
      cdnLoc,
      cacheString,
      manifestToParse
    );
    if (executablePromise) {
      returnPromiseArray.push(executablePromise());
    }
  }

  for (const manualEntry of manifestToParse.manifest.manualEntries) {
    const executablePromise = await checkFileAndGetExecutablePromise(
      manualEntry.entryPoint,
      cdnLoc,
      cacheString,
      manifestToParse,
      manualEntry.appId
    );
    if (executablePromise) {
      returnPromiseArray.push(executablePromise());
    }
  }

  return returnPromiseArray;
}
export async function loadModernApps(contextChange = false) {
  if (contextChange) {
    handleContextChange();
  }
  if (isLoaded) return;
  isLoaded = true;
  //LOAD collectionconfig.json
  const coreCollection = await fetchAppCollectionConfigFromAllLocations();
  const allManifestTXTs = getManifestTXTFromAllLocations(coreCollection);

  window.__SPFxExtensions.Utils.appManifestPromises = allManifestTXTs;
  window.__SPFxExtensions.Utils.spAppInitializationPromiseResolver();

  const allManifestTXTsPromises = await Promise.allSettled(allManifestTXTs);
  const resolvedManifestTXTs = allManifestTXTsPromises.filter((p) => p.status === "fulfilled");

  const successfullAppRegistrations: Promise<SPFxExtensionAppRegistration[]>[] = [];
  const resolvedRootAppsManifests = resolvedManifestTXTs.filter((m) => m.value.type === "root");
  const resolvedHubAppsManifests = resolvedManifestTXTs.filter((m) => m.value.type === "hub");
  const resolvedSiteAppsManifests = resolvedManifestTXTs.filter((m) => m.value.type === "site");
  const resolvedWebAppsManifests = resolvedManifestTXTs.filter((m) => m.value.type === "web");

  //sort out so that root is first to go, that way root cannot be overriden by site and site cannot be overriden by web
  //TODO: check performance impact

  for (const rootManifestTXT of resolvedRootAppsManifests) {
    const rootEntries = await parseManifestAndImportEntryPoints(rootManifestTXT.value);
    successfullAppRegistrations.push(...rootEntries);
  }
  logGenericCoreDebug("Root apps loaded.");

  for (const hubManifests of resolvedHubAppsManifests) {
    const hubEntries = await parseManifestAndImportEntryPoints(hubManifests.value);
    successfullAppRegistrations.push(...hubEntries);
  }
  logGenericCoreDebug("Hub apps loaded.");

  //wait for site stuff to load
  for (const siteManifests of resolvedSiteAppsManifests) {
    const siteEntries = await parseManifestAndImportEntryPoints(siteManifests.value);
    successfullAppRegistrations.push(...siteEntries);
  }
  logGenericCoreDebug("Site apps loaded.");

  //wait for web stuff to load
  for (const webManifests of resolvedWebAppsManifests) {
    const webEntries = await parseManifestAndImportEntryPoints(webManifests.value);
    successfullAppRegistrations.push(...webEntries);
  }
  logGenericCoreDebug("SiteWeb apps loaded.");
  const successfullyRegistered = (await Promise.allSettled(successfullAppRegistrations))
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
  //unregister any remaining app definitions that are not applicable to this context
  await unregisterNonApplicable(successfullyRegistered);
  window.__SPFxExtensions.AllAppAssetsLoadedResolver();
  logGenericCoreInfo("SPFx Extensions Core Components Loaded.");
}

function handleContextChange() {
  isLoaded = false;
  const contextId = getNewContext();
  loadedAssets.splice(0, loadedAssets.length);
  unmountInstancesOnContextChange(contextId);
  const { promise, resolve } = Promise.withResolvers<void>();
  window.__SPFxExtensions.AllAppAssetsLoadedPromise = promise;
  window.__SPFxExtensions.AllAppAssetsLoadedResolver = resolve;
}

async function unregisterNonApplicable(allExports: SPFxExtensionAppRegistration[]) {
  const shouldUnregisterIds: string[] = [];
  for (const alreadyRegisteredApp of window.__SPFxExtensions.Apps) {
    const foundApp = allExports.find((a) => a.id === alreadyRegisteredApp.id);
    if (
      !foundApp &&
      !alreadyRegisteredApp.isManual &&
      alreadyRegisteredApp.id !== CONFIGURATOR_APP_ID
    ) {
      shouldUnregisterIds.push(alreadyRegisteredApp.id);
    }
  }
  for (const appId of shouldUnregisterIds) {
    //unregister app as it does not belong to this context
    const unregistered = await window.__SPFxExtensions.UnregisterApp(appId);
    if (unregistered) {
      logGenericCoreWarning(
        `Unregistered App ${unregistered.id} (${unregistered.name}) as it does not belong in this context`
      );
    }
  }
}

async function executeRegistrations(
  registrations: SPFxExtensionAppRegistration[],
  manifestToParse: SPFxExtensionFolderManifest,
  fullJSUrl: string
) {
  // const isHub = getIsHubSite();

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
    const foundMapItem = manifestToParse.appDefinitionMap.find(
      (a) => a.appId.toLowerCase() === appReg.id.toLowerCase()
    );
    const notEnabledMSG = `App with id ${appReg.id} (${appReg.name}) is not enabled for current web. Skipping...`;
    if (!foundMapItem) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }
    const appEnabled = isEntryEnabledInCurrentContext(foundMapItem);

    if (!appEnabled) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }
    const registeredApp = await window.__SPFxExtensions.RegisterApp(appReg);
    successfullyRegistered.push(appReg);
    if (!appReg.isWebPartApp && appReg.autoExecute) {
      if (registeredApp.instances.length < (appReg.maxInstances ?? Infinity)) {
        window.__SPFxExtensions.InstantiateApp(appReg.id, {});
      }
    }
  }
  return successfullyRegistered;
}

function isEntryEnabledInCurrentContext(foundMapItem: SPFxExtensionAppDefinitionConfig) {
  const currentWebId = getWebId().toLowerCase();
  const currentSiteId = getSiteId().toLowerCase();
  const currentHubId = getHubSiteId().toLowerCase();

  const isEnabledEverywhere = foundMapItem.config.enabledEverywhere;

  const appNotExcluded =
    foundMapItem.config.excludedIds.indexOf(currentWebId) === -1 &&
    foundMapItem.config.excludedIds.indexOf(currentSiteId) === -1 &&
    foundMapItem.config.excludedHubIds.indexOf(currentHubId) === -1;

  const appIsIncluded =
    foundMapItem.config.includedIds.indexOf(currentWebId) !== -1 ||
    foundMapItem.config.includedIds.indexOf(currentSiteId) !== -1 ||
    foundMapItem.config.includedHubIds.indexOf(currentHubId) !== -1;

  const appEnabled = isEnabledEverywhere ? appNotExcluded : appIsIncluded;
  return appEnabled;
}
