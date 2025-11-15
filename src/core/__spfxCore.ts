import type { SPFxExtensionAppRegistration } from "../models/appModel";
import { CONFIGURATOR_APP_ID } from "../utilities/constants";
import { initCoreServices } from "./services/initializationService";
import {
  logGenericCoreDebug,
  logGenericCoreError,
  logGenericCoreInfo,
} from "./services/loggingService";
//solution id 7d56fff0-e90e-40a7-98cf-fcdbc63a9b01
//feature id 83e13c11-682e-4eaa-9ae0-74617ca28f96
//wp id d6ca1fc2-0591-4c6d-8a25-cae3262c017b
//ext id 5f051733-351a-4c5f-b64e-de96d1dc90b3
//wp prop: DBModernAppConfiguration

const configuratorApp: SPFxExtensionAppRegistration = {
  id: CONFIGURATOR_APP_ID,
  description: "Allows configuring custom apps",
  isWebPartApp: false,
  hideAppSelectorWhenAppLoaded: true,
  hideConfiguratorButton: true,
  name: "SPFx Extensions Configurator",
  async onInstanceRequested(newInstance) {
    const coreIsInDebug = import.meta.url.indexOf("localhost") > -1;
    if (coreIsInDebug) {
      logGenericCoreDebug("Core is in debug mode");
    }
    const configuratorUrl = coreIsInDebug
      ? import.meta.resolve(`./__spfxCoreConfigurator.js?v=${Date.now()}`)
      : window.__SPFxExtensions.__ConfiguratorUrl;
    try {
      const module = await import(configuratorUrl);
      return module.launch(newInstance);
    } catch (e) {
      logGenericCoreError("Error launching configurator app", e);
      if (newInstance.domElement) {
        newInstance.domElement.innerHTML = `<div style="text-align: center; padding: 20px; color: red;">Error launching configurator app. ${e}</div>`;
      }
      return () => {};
    }
  },
};

const buildDate = BUILD_DATE;

logGenericCoreInfo(`Initializing SPFxExtensions Core Built:`, buildDate);
await initCoreServices();
try {
  await window.__SPFxExtensions.RegisterApp(configuratorApp);
} catch (e) {
  logGenericCoreError("Error registering configurator app", e);
}
