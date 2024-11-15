import { initCoreServices } from "./services/initializationService";
import { CONFIGURATOR_APP_ID, SPFxExtensionCore } from "../utilities/constants";
import type { SPFxExtensionAppRegistration } from "../models/appModel";
import { launchSPFxExtensionApp } from "../services/appLauncher";
import { launch } from "./configurator/app";
const configuratorApp: SPFxExtensionAppRegistration = {
  id: CONFIGURATOR_APP_ID,
  description: "Allows configuring custom apps",
  isWebPartApp: false,
  hideAppSelectorWhenAppLoaded: true,
  name: "SPFx Extensions Configurator",
  async onInstanceRequested(newInstance) {
    console.log(SPFxExtensionCore, "Configurator App Instance Requested", newInstance);
    launchSPFxExtensionApp({ launch }, newInstance);
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
