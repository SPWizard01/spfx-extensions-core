import { ensureApp } from "./appService";
import { isAppAllowedInCurrentWeb } from "./allowedAppsService";
import { SPFxExtensionCore } from "../utilities/constants";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppEntryPoint,
  SPFxExtensionAppInstance,
} from "../models/appModel";
import type {
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
} from "../models/events";
import type { SPFxExtensionAppRuntimeConfig } from "../models/appConfig";

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
      console.debug(SPFxExtensionCore, "Removing event listener", eventListener);
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
  console.debug(
    SPFxExtensionCore,
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
      console.error(SPFxExtensionCore, "Error executing instanceAdded event", e);
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
    start: emptyDummy,
    unmount: emptyDummy,
    allEventListeners: [],
    addEventListener: emptyDummy,
    // removeEventListener: emptyDummy,
    executeListeners: emptyDummy,
    whenLoad: loadPromise,
    whenLoadResolve: emptyDummy,
  };

  appInstance.whenLoadResolve = loadPromiseResolve!;
  appInstance.start = (launch) => {
    launchSPFxExtensionApp({ launch }, appInstance);
  };

  registerEventHandlers(appInstance);
  return appInstance;
}

export function registerAppInstanceService() {
  if (!window.__SPFxExtensions.LoadApp) {
    window.__SPFxExtensions.LoadApp = async (
      appId: string,
      runTimeConfig: SPFxExtensionAppRuntimeConfig
    ) => {
      const checkApp = {
        description: "",
        id: appId,
        isWebPartApp: false,
        hideAppSelectorWhenAppLoaded: false,
        name: "",
      };
      // if (await isAppBlacklistedInCurrentWeb(checkApp)) {
      //   return null;
      // }

      if (!(await isAppAllowedInCurrentWeb(checkApp))) {
        return undefined;
      }

      const foundApp = ensureApp(appId);
      console.debug(SPFxExtensionCore, `Creating app instance for app`, appId);
      const appInstance = createAppInstance(runTimeConfig);
      foundApp.instances.push(appInstance);
      appInstance.unmount = () => {
        unmountAppInstance(foundApp, appInstance);
      };

      executeAppInstanceListeners(foundApp, appInstance);
      //this will only be available once the app registration passes, ensureApp does not create this property
      foundApp.onInstanceRequested?.(appInstance);

      return appInstance;
    };
  }
}
function launchSPFxExtensionApp(
  arg0: { launch: SPFxExtensionAppEntryPoint },
  appInstance: SPFxExtensionAppInstance
) {
  throw new Error("Function not implemented.");
}
