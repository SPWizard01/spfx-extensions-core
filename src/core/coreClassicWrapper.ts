import type { SPFxExtensionUtilsPlaceHolderProvider } from "../models/appUtils";
import { getClassicDisplayMode } from "../utilities/display";
import { loadCoreForSPFxOrClassicWrapper } from "./classicLoader";
import { logGenericCoreError } from "./services/loggingService";

const IS_MODERN_EXPIRIENCE = !!!window._spBodyOnLoadFunctions;
async function initClassicCore() {
  if (IS_MODERN_EXPIRIENCE) {
    logGenericCoreError(
      "This module can only be initialized in classic mode"
    );
    return window.__SPFxExtensions.__CorePromise;
  }
  if (!window.__SPFxExtensions.Utils) {


    const { promise, resolve } = Promise.withResolvers<SPFxExtensionUtilsPlaceHolderProvider>();

    let spAppInitializationPromiseResolver = () => {
      // This does nothing. Comment to avoid eslint error
    };

    const spAppInitializationPromise = new Promise<void>((resolve) => {
      spAppInitializationPromiseResolver = resolve;
    });

    window.__SPFxExtensions.Utils = {
      displayMode: getClassicDisplayMode(),
      environmentType: "ClassicSharePoint",
      ConfiguratorUrl: "",
      placeHolderProviderPromise: promise,
      placeHolderResolver: resolve,
      placeHolderResolved: false,
      appManifestPromises: [],
      spAppInitializationPromise,
      spAppInitializationPromiseResolver,
      initedThroughModern: false,
      fluentIconsInitialized: false,
    };
  }

  loadCoreForSPFxOrClassicWrapper();
}

function init() {
  // page just loaded and body onload has not been called yet
  if (!window._spBodyOnLoadCalled && window._spBodyOnLoadFunctions) {
    window._spBodyOnLoadFunctions.push(initClassicCore);
    return;
  }
  // we are late on the execution so this will have to be called manually
  if (window._spBodyOnLoadCalled) {
    initClassicCore();
    return;
  }
  logGenericCoreError(
    "No _spBodyOnLoadFunctions or _spBodyOnLoadCalled object present. Can not initialize classic wrapper"
  );
}

init();
