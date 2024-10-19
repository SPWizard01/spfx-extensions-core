import type { SPFxExtensionUtilsPlaceHolderProvider } from "./models/appUtils";
import { getCompatiblePageContextAsync } from "./services/spContextService";
import { loadCoreForSPFxOrClassicWrapper } from "./services/spfxEntry";
import { getClassicDisplayMode } from "./utilities/common";
import { SPFxExtensionCore } from "./utilities/constants";

const IS_MODERN_EXPIRIENCE = !!!window._spBodyOnLoadFunctions;
async function initClassicCore() {
  if (IS_MODERN_EXPIRIENCE) {
    console.error(
      SPFxExtensionCore,
      "This module can only be initialized in classic mode"
    );
    return window.__SPFxExtensions.__CorePromise;
  }
  if (!window.__SPFxExtensions.Utils) {
    let resolver: (obj: SPFxExtensionUtilsPlaceHolderProvider) => void;

    const promise = new Promise<SPFxExtensionUtilsPlaceHolderProvider>(
      (resolve) => {
        resolver = resolve;
      }
    );

    let spAppInitializationPromiseResolver = () => {
      // This does nothing. Comment to avoid eslint error
    };

    const spAppInitializationPromise = new Promise<void>((resolve) => {
      spAppInitializationPromiseResolver = resolve;
    });

    const ctxInfo = await getCompatiblePageContextAsync();
    window.__SPFxExtensions.Utils = {
      context: ctxInfo,
      displayMode: getClassicDisplayMode(),
      environmentType: "ClassicSharePoint",

      placeHolderProviderPromise: promise,
      placeHolderResolver: resolver!,
      placeHolderResolved: false,
      appManifestPromises: [],
      spAppInitializationPromise,
      spAppInitializationPromiseResolver,
      originalPushState: window.history.pushState,
      originalReplaceState: window.history.replaceState,
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
  console.error(
    "No _spBodyOnLoadFunctions or _spBodyOnLoadCalled object present. Can not initialize classic wrapper"
  );
}

init();
