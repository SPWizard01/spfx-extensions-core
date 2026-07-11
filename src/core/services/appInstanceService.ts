import type { SPFxExtensionAppRuntimeConfig } from "../../models/appConfig";
import type { SPFxExtensionAppDefinition, SPFxExtensionAppInstance } from "../../models/appModel";
import type {
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
} from "../../models/events";
import { emptyDummy, getCurrentContextId } from "../../utilities/helpers";
import { ensureApp } from "./appDefinitionService";
import { loadAppInstance, unmountAppInstance } from "./appServices";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreWarning } from "./loggingService";

function registerEventHandlers(appInstance: SPFxExtensionAppInstance) {
  const removeInstanceEventListener = (eventListener: SPFxExtensionAppInstanceEventListener) => {
    const idx = appInstance.allEventListeners.findIndex((el) => el.key === eventListener.key);
    if (idx > -1) {
      logGenericCoreDebug("Removing event listener", eventListener);
      appInstance.allEventListeners.splice(idx, 1);
    }
  };

  const addInstanceEventListener = <
    EVENT_TYPE extends keyof SPFxExtensionAppInstanceEvents = keyof SPFxExtensionAppInstanceEvents,
  >(
    eventName: EVENT_TYPE,
    callback: (eventData: SPFxExtensionAppInstanceEvents[EVENT_TYPE]) => void
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
    K extends keyof SPFxExtensionAppInstanceEvents = keyof SPFxExtensionAppInstanceEvents,
  >(
    eventName: K,
    eventData: SPFxExtensionAppInstanceEvents[K]
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

function executeInstanceAddedListeners(
  appDefinition: SPFxExtensionAppDefinition,
  appInstance: SPFxExtensionAppInstance
) {
  logGenericCoreDebug(
    `Executing instanceAdded event for app`,
    appDefinition.id,
    "instance",
    appInstance.key
  );
  window.__SPFxExtensions.AppEventListeners.filter((l) => l.eventName === "instanceAdded").forEach(
    (listener) => {
      try {
        listener.handler({ app: appDefinition, instance: appInstance });
      } catch (e) {
        logGenericCoreError("Error executing instanceAdded event", e);
      }
    }
  );
}

export function createAppInstance(
  app: SPFxExtensionAppDefinition,
  runTimeConfig: SPFxExtensionAppRuntimeConfig
) {
  const {
    promise: instanceLoadPromise,
    resolve: instanceLoadPromiseResolver,
    reject: instanceLoadPromiseReject,
  } = Promise.withResolvers<void>();
  const key = runTimeConfig.webpart?.instanceId ?? window.crypto.randomUUID();
  const appInstance: SPFxExtensionAppInstance = {
    ...runTimeConfig,
    key,
    contextId: getCurrentContextId(),
    instanceRequested: false,
    instanceExecuted: false,
    unmountOnRender: true,
    unmount: () => {
      unmountAppInstance(app, key);
    },
    allEventListeners: [],
    addEventListener: emptyDummy,
    executeListeners: emptyDummy,
    instanceLoadPromise,
    instanceLoadPromiseResolver,
    instanceLoadPromiseReject,
  };

  registerEventHandlers(appInstance);
  return appInstance;
}

export function registerAppInstanceService() {
  if (!window.__SPFxExtensions.InstantiateApp) {
    window.__SPFxExtensions.InstantiateApp = (
      appId: string,
      runTimeConfig: SPFxExtensionAppRuntimeConfig
    ) => {
      const ensuredApp = ensureApp(appId);
      logGenericCoreDebug(`Creating app instance for app`, appId);
      const appInstance = createAppInstance(ensuredApp, runTimeConfig);
      appInstance.unmountOnRender = ensuredApp.unmountOnRender ?? true;
      ensuredApp.instances.push(appInstance);

      executeInstanceAddedListeners(ensuredApp, appInstance);
      //this will only be available once the app registration passes
      if (ensuredApp.registrationCompleted) {
        loadAppInstance(ensuredApp, appInstance);
      }

      return appInstance;
    };
  }
}
