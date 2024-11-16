import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { APP_LOADING } from "../../utilities/constants";
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
    window.__SPFxExtensions.RegisterApp = async (appdef) => {
      const app = ensureApp(appdef.id);
      const isNew = app.name === APP_LOADING && app.description === APP_LOADING;
      if (!isNew) {
        logGenericCoreError(
          "App",
          app,
          "is being re-registered. This is not allowed."
        );
        return null;
      }
      app.name = appdef.name;
      app.description = appdef.description;
      app.isWebPartApp = appdef.isWebPartApp;
      app.hideAppSelectorWhenAppLoaded =
        appdef.hideAppSelectorWhenAppLoaded ?? false;
      app.icon = appdef.icon;
      app.onInstanceRequested = appdef.onInstanceRequested;
      app.instances.forEach((i) => {
        try {
          app.onInstanceRequested?.(i).catch((e) => {
            logInstanceRequestedError(app, e);
          });
        } catch (e) {
          logInstanceRequestedError(app, e);
        }
      });
      executeAppAddedEvents(app);

      return app;
    };
  }
}


