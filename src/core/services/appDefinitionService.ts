import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { APP_LOADING } from "../../utilities/constants";
import { emptyDummy } from "../../utilities/helpers";
import { loadAppInstance } from "./appServices";
import { logGenericCoreDebug, logGenericCoreError } from "./loggingService";

function executeAppAddedEvents(appDef: SPFxExtensionAppDefinition) {
  logGenericCoreDebug(`Executing appAdded event for`, appDef.id);
  window.__SPFxExtensions.AppEventListeners.filter((l) => l.eventName === "appAdded").forEach(
    (listener) => {
      try {
        listener.handler(appDef);
      } catch (e) {
        logGenericCoreError("Error executing appAdded event", e);
      }
    }
  );
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
      unmountOnRender: true,
      keepOnContextChange: false,
      autoExecute: false,
      maxInstances: Infinity,
      hideAppSelectorWhenAppLoaded: false,
      hideConfiguratorButton: false,
      registrationCompleted: false,
      isManual: false,
      instances: [],
      async onInstanceRequested() {
        return emptyDummy;
      },
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
      if (appDefinition.registrationCompleted) {
        return appDefinition;
      }
      appDefinition.name = newAppDefinition.name;
      appDefinition.description = newAppDefinition.description;
      appDefinition.isWebPartApp = newAppDefinition.isWebPartApp;
      appDefinition.keepOnContextChange = newAppDefinition.keepOnContextChange ?? false;
      appDefinition.autoExecute = newAppDefinition.autoExecute ?? false;
      appDefinition.isManual = newAppDefinition.isManual ?? false;
      appDefinition.unmountOnRender = newAppDefinition.unmountOnRender ?? true;
      appDefinition.maxInstances = newAppDefinition.maxInstances ?? Infinity;
      appDefinition.hideAppSelectorWhenAppLoaded =
        newAppDefinition.hideAppSelectorWhenAppLoaded ?? false;
      appDefinition.hideConfiguratorButton = newAppDefinition.hideConfiguratorButton ?? false;
      appDefinition.icon = newAppDefinition.icon;
      appDefinition.onInstanceRequested = newAppDefinition.onInstanceRequested;
      appDefinition.registrationCompleted = true;
      executeAppAddedEvents(appDefinition);
      appDefinition.instances.forEach((appInstance) => {
        loadAppInstance(appDefinition, appInstance);
      });

      return appDefinition;
    };
  }

  if (!window.__SPFxExtensions.UnregisterApp) {
    window.__SPFxExtensions.UnregisterApp = async (appId) => {
      const appDefinitionIdx = window.__SPFxExtensions.Apps.findIndex((a) => a.id === appId);
      if (appDefinitionIdx < 0) {
        return;
      }
      const appDefinition = window.__SPFxExtensions.Apps.splice(appDefinitionIdx, 1);
      if (appDefinition.length < 1) {
        return;
      }
      logGenericCoreDebug(`Unregistering app`, appDefinition[0].id, appDefinition[0].name);
      appDefinition[0].instances.forEach((appInstance) => {
        if (appInstance.instanceExecuted) {
          appInstance.unmount();
        }
      });

      return appDefinition[0];
    };
  }
}
