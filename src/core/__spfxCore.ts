import type { SPFxExtensionAppRegistration } from "../models/appModel";
import { launchSPFxExtensionApp } from "../services/appLauncher";
import { CONFIGURATOR_APP_ID } from "../utilities/constants";
import { initCoreServices } from "./services/initializationService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreInfo } from "./services/loggingService";
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
    const configuratorUrl = coreIsInDebug ? import.meta.resolve("./__spfxCoreConfigurator.js") : window.__SPFxExtensions.__ConfiguratorUrl;
    const module = await import(configuratorUrl)
    launchSPFxExtensionApp(module, newInstance);
  },
}

export async function start() {
  const buildDate = BUILD_DATE;
  logGenericCoreInfo(`Initializing Core Services Built:`, buildDate);
  initCoreServices().then(() => {
    try {
      window.__SPFxExtensions.RegisterApp(configuratorApp);
    }
    catch (e) {
      logGenericCoreError("Error registering configurator app", e);
    }
  });
}

start();
