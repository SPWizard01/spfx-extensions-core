import type { SPFxExtensionAppDefinition, SPFxExtensionAppInstance } from "../../models/appModel";
import { APP_LOADING } from "../../utilities/constants";
import { loadAppInstances } from "./appServices";
import { logGenericCoreDebug, logGenericCoreError, logInstanceRequestedError } from "./loggingService";

function executeAppAddedEvents(appDef: SPFxExtensionAppDefinition) {
  logGenericCoreDebug(`Executing appAdded event for`, appDef.id);
  window.__SPFxExtensions.AppEventListeners.filter(
    (l) => l.eventName === "appAdded"
  ).forEach((listener) => {
    try {
      listener.handler(appDef);
    } catch (e) {
      logGenericCoreError("Error executing appAdded event", e);
    }
  });
}

export function ensureApp(appId: string) {
  let foundApp = window.__SPFxExtensions.Apps.find((a) => a.id === appId);

  if (!foundApp) {
    logGenericCoreDebug(`Registering new app`, appId);
    foundApp = {
      id: appId,
      name: APP_LOADING,
      description: APP_LOADING,
      isWebPartApp: false,
      hideAppSelectorWhenAppLoaded: false,
      hideConfiguratorButton: false,
      instances: [],
    };
    window.__SPFxExtensions.Apps.push(foundApp);
  }
  return foundApp;
}


export function registerAppService() {
  if (!window.__SPFxExtensions.Apps) {
    window.__SPFxExtensions.Apps = [];
  }

  if (!window.__SPFxExtensions.RegisterApp) {
    window.__SPFxExtensions.RegisterApp = async (newAppDefinition) => {
      const appDefinition = ensureApp(newAppDefinition.id);
      const isNew = appDefinition.name === APP_LOADING && appDefinition.description === APP_LOADING;
      if (!isNew) {
        logGenericCoreError(
          "App",
          appDefinition,
          "is being re-registered. This is not allowed."
        );
        return null;
      }
      appDefinition.name = newAppDefinition.name;
      appDefinition.description = newAppDefinition.description;
      appDefinition.isWebPartApp = newAppDefinition.isWebPartApp;
      appDefinition.hideAppSelectorWhenAppLoaded =
        newAppDefinition.hideAppSelectorWhenAppLoaded ?? false;
      appDefinition.hideConfiguratorButton = newAppDefinition.hideConfiguratorButton ?? false;
      appDefinition.icon = newAppDefinition.icon;
      appDefinition.onInstanceRequested = newAppDefinition.onInstanceRequested;
      appDefinition.instances.forEach((appInstance) => {
        loadAppInstances(appDefinition, appInstance);
      });
      executeAppAddedEvents(appDefinition);

      return appDefinition;
    };
  }
}


