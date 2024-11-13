import { initCoreServices } from "./services/initializationService";
import { SPFxExtensionCore } from "../utilities/constants";
import type { SPFxExtensionAppRegistration } from "../models/appModel";
import { CONFIGURATOR_APP_ID } from "./utilities/coreConstants";

const configuratorApp: SPFxExtensionAppRegistration = {
  id: CONFIGURATOR_APP_ID,
  description: "Allows configuring custom apps",
  isWebPartApp: false,
  hideAppSelectorWhenAppLoaded: true,
  name: "SPFx Extensions Configurator",
  async onInstanceRequested(newInstance) {
    console.log(SPFxExtensionCore, "Configurator App Instance Requested", newInstance);

  },
}

export async function start() {
  const buildDate = BUILD_DATE;
  console.info(SPFxExtensionCore, `Initializing Core Services Built:`, buildDate);
  initCoreServices().then(() => {
    window.__SPFxExtensions.RegisterApp(configuratorApp);
  });
}

start();
