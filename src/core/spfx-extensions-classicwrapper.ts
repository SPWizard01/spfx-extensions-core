import { CONFIGURATOR_JS_NAME, CORE_JS_NAME } from "../utilities/runtimeConstants";
import { loadCoreForSPFxOrClassic } from "./spfx-extensions-loader";

const SPFXPWRAPPERREFIX = "[SPFxExtensions/Wrapper]";
const IS_MODERN_EXPIRIENCE = !window._spBodyOnLoadFunctions;

async function initClassicCore() {
  if (IS_MODERN_EXPIRIENCE) {
    console.error(SPFXPWRAPPERREFIX, "This module can only be initialized in classic mode");
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
  console.info(SPFXPWRAPPERREFIX, "Initializing SPFxExtensions Core from Classic SharePoint page");
  const coreUrl = import.meta.resolve(`./${CORE_JS_NAME}?v=${Date.now()}`);
  const configuratorUrl = import.meta.resolve(`./${CONFIGURATOR_JS_NAME}.js?v=${Date.now()}`);
  const urlResolver = async () => {
    return { coreUrl, configuratorUrl };
  };
  await loadCoreForSPFxOrClassic(urlResolver, "ClassicSharePoint", false);
  window.__SPFxExtensions.__CoreInitializationResolver();
}
/**
 * This method is called by `spfx-extensions-classiccustomaction` which is added to classic pages via custom actions script.
 *
 * We have to wait for body onload to ensure that the global defs added by sp.js are present before we try to use them.
 *
 * For modern pages, the `spfx-extensions-loader` is responsible for initializing the core.
 *
 * It is invoked either by app customizer or webpart, whichever loads first.
 *
 * This is because modern pages do not have the concept of onload functions queue like classic pages, so we can not rely on that mechanism to delay our initialization until sp.js is loaded.
 * @returns
 */
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
    SPFXPWRAPPERREFIX,
    "No _spBodyOnLoadFunctions or _spBodyOnLoadCalled object present. Can not initialize classic wrapper"
  );
}
