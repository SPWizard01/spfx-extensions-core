import type { SPFxExtensionAppRuntimeConfig } from "../../models/appConfig";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
} from "../../models/appModel";
import type {
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
} from "../../models/events";
import { ensureApp } from "./appService";
import { logGenericCoreDebug, logGenericCoreError, logInstanceRequestedError } from "./loggingService";

const emptyDummy = () => {
  throw "This should not happen";
};

function unmountAppInstance(
  appDef: SPFxExtensionAppDefinition,
  appInstance: SPFxExtensionAppInstance
) {
  appInstance.executeListeners("onConfigurationClose", undefined);
  appInstance.allEventListeners.splice(0, appInstance.allEventListeners.length);
  const idx = appDef.instances.findIndex((i) => i.key === appInstance.key);
  if (idx > -1) {
    appDef.instances.splice(idx, 1);
  }
}

function registerEventHandlers(appInstance: SPFxExtensionAppInstance) {
  const removeInstanceEventListener = (
    eventListener: SPFxExtensionAppInstanceEventListener
  ) => {
    const idx = appInstance.allEventListeners.findIndex(
      (el) => el.key === eventListener.key
    );
    if (idx > -1) {
      logGenericCoreDebug("Removing event listener", eventListener);
      appInstance.allEventListeners.splice(idx, 1);
    }
  };

  const addInstanceEventListener = <
    EVENT_TYPE extends keyof SPFxExtensionAppInstanceEvents,
    RETURN_TYPE extends SPFxExtensionAppInstanceEvents[EVENT_TYPE]
  >(
    eventName: EVENT_TYPE,
    callback: (eventData: RETURN_TYPE) => void
  ) => {
    const eventListener: SPFxExtensionAppInstanceEventListener = {
      key: window.crypto.randomUUID(),
      eventName,
      handler: callback,
    };
    appInstance.allEventListeners.push(eventListener);
    return () => {
      removeInstanceEventListener(eventListener);
    };
  };

  const executeInstanceListeners = <
    K extends keyof SPFxExtensionAppInstanceEvents,
    R extends SPFxExtensionAppInstanceEvents[K]
  >(
    eventName: K,
    eventData: R
  ) => {
    for (const eventListener of appInstance.allEventListeners) {
      if (eventListener.eventName != eventName) continue;
      if (eventListener.handler) eventListener.handler(eventData);
    }
  };

  appInstance.addEventListener = addInstanceEventListener;
  // appInstance.removeEventListener = removeInstanceEventListener;
  appInstance.executeListeners = executeInstanceListeners;
}

function executeAppInstanceListeners(
  appDefinition: SPFxExtensionAppDefinition,
  appInstance: SPFxExtensionAppInstance
) {
  logGenericCoreDebug(
    `Executing instanceAdded event for app`,
    appDefinition.id,
    "instance",
    appInstance.key
  );
  window.__SPFxExtensions.AppEventListeners.filter(
    (l) => l.eventName === "instanceAdded"
  ).forEach((listener) => {
    try {
      listener.handler({ app: appDefinition, instance: appInstance });
    } catch (e) {
      logGenericCoreError("Error executing instanceAdded event", e);
    }
  });
}

export function createAppInstance(
  runTimeConfig: SPFxExtensionAppRuntimeConfig
) {
  // these will be replaced later on

  let loadPromiseResolve: (value?: any) => void;

  const loadPromise = new Promise<void>((resolve) => {
    loadPromiseResolve = resolve;
  });

  const appInstance: SPFxExtensionAppInstance = {
    key: window.crypto.randomUUID(),
    element: runTimeConfig.domElement,
    webpartContext: runTimeConfig.webpartContext,
    openPropertyPane: runTimeConfig.openPropertyPane,
    closePropertyPane: runTimeConfig.closePropertyPane,
    saveConfigValue: runTimeConfig.saveConfigValue,
    getConfigValue: runTimeConfig.getConfigValue,
    isLoaded: false,
    unmount: emptyDummy,
    allEventListeners: [],
    addEventListener: emptyDummy,
    executeListeners: emptyDummy,
    whenLoad: loadPromise,
    whenLoadResolve: emptyDummy,
  };

  appInstance.whenLoadResolve = loadPromiseResolve!;

  registerEventHandlers(appInstance);
  return appInstance;
}

export function registerAppInstanceService() {
  if (!window.__SPFxExtensions.LoadApp) {
    window.__SPFxExtensions.LoadApp = async (
      appId: string,
      runTimeConfig: SPFxExtensionAppRuntimeConfig
    ) => {

      const foundApp = ensureApp(appId);
      logGenericCoreDebug(`Creating app instance for app`, appId);
      const appInstance = createAppInstance(runTimeConfig);
      foundApp.instances.push(appInstance);
      appInstance.unmount = () => {
        unmountAppInstance(foundApp, appInstance);
      };

      executeAppInstanceListeners(foundApp, appInstance);
      //this will only be available once the app registration passes, ensureApp does not create this property
      try {
        foundApp.onInstanceRequested?.(appInstance).catch((e) => {
          logInstanceRequestedError(foundApp, e);
        });
      }
      catch (e) {
        logInstanceRequestedError(foundApp, e);
      }

      return appInstance;
    };
  }
}
