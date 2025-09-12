import { loadCoreForSPFxOrClassic } from "./__spfxLoader";

const SPFXPREFIX = "[SPFxExtensions/Wrapper]";
const IS_MODERN_EXPIRIENCE = !window._spBodyOnLoadFunctions;

async function initClassicCore() {
  if (IS_MODERN_EXPIRIENCE) {
    console.error(SPFXPREFIX, "This module can only be initialized in classic mode");
    return;
  }

  if (window.__SPFxExtensions?.__CoreInitializationPromise) {
    return window.__SPFxExtensions.__CoreInitializationPromise;
  }
  const { promise, resolve } = Promise.withResolvers<void>();
  (window.__SPFxExtensions as any) = {
    __CoreInitializationPromise: promise,
    __CoreInitializationResolver: resolve,
  };
  console.info(SPFXPREFIX, "Initializing SPFxExtensions Core from Classic SharePoint page");
  const coreUrl = import.meta.resolve(`./spfx-extension-core.js?v=${Date.now()}`);
  const configuratorUrl = import.meta.resolve(
    `./spfx-extension-coreconfigurator.js?v=${Date.now()}`
  );
  const urlResolver = async () => {
    return { coreUrl, configuratorUrl };
  };
  await loadCoreForSPFxOrClassic(urlResolver, "ClassicSharePoint", false);
  window.__SPFxExtensions.__CoreInitializationResolver();
}

export function init() {
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
    SPFXPREFIX,
    "No _spBodyOnLoadFunctions or _spBodyOnLoadCalled object present. Can not initialize classic wrapper"
  );
}
