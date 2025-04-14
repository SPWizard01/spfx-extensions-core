import { loadCoreForSPFxOrClassic } from "./__spfxLoader";
const SPFXPREFIX = "[SPFxExtensions/Wrapper]";
const IS_MODERN_EXPIRIENCE = !window._spBodyOnLoadFunctions;
let corePromise: Promise<void> | undefined = undefined;
async function initClassicCore() {
  if (IS_MODERN_EXPIRIENCE) {
    console.error(
      SPFXPREFIX,
      "This module can only be initialized in classic mode"
    );
    return;
  }
  if (!corePromise) {
    console.info(SPFXPREFIX, "Initializing SPFx Extensions Core from Classic SharePoint page");
    const coreUrl = import.meta.resolve(`./spfx-extension-core.js?v=${Date.now()}`);
    const configuratorUrl = import.meta.resolve(`./spfx-extension-coreconfigurator.js?v=${Date.now()}`);
    corePromise = loadCoreForSPFxOrClassic(async () => { return { coreUrl, configuratorUrl }; }, "ClassicSharePoint", false)
  }
  return corePromise;
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
