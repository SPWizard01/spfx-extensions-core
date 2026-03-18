import type { SPFxExtensionAppRuntimeConfig } from "../../models/appConfig";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
} from "../../models/appModel";
import type {
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
} from "../../models/events";
import { emptyDummy, getCurrentContextId } from "../../utilities/helpers";
import { ensureApp } from "./appDefinitionService";
import { loadAppInstance } from "./appServices";
import { logGenericCoreDebug, logGenericCoreError } from "./loggingService";

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
    EVENT_TYPE extends keyof SPFxExtensionAppInstanceEvents = keyof SPFxExtensionAppInstanceEvents
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
  const { promise: instanceLoadPromise, resolve: instanceLoadPromiseResolver } =
    Promise.withResolvers<void>();

  const appInstance: SPFxExtensionAppInstance = {
    ...runTimeConfig,
    key: window.crypto.randomUUID(),
    contextId: getCurrentContextId(),
    instanceRequested: false,
    instanceExecuted: false,
    unmountOnRender: true,
    unmount: emptyDummy,
    allEventListeners: [],
    addEventListener: emptyDummy,
    executeListeners: emptyDummy,
    instanceLoadPromise,
    instanceLoadPromiseResolver,
  };

  registerEventHandlers(appInstance);
  return appInstance;
}

export function registerAppInstanceService() {
  if (!window.__SPFxExtensions.InstantiateApp) {
    window.__SPFxExtensions.InstantiateApp = async (
      appId: string,
      runTimeConfig: SPFxExtensionAppRuntimeConfig
    ) => {
      const foundApp = ensureApp(appId);
      logGenericCoreDebug(`Creating app instance for app`, appId);
      const appInstance = createAppInstance(runTimeConfig);
      appInstance.unmountOnRender = foundApp.unmountOnRender ?? true;
      foundApp.instances.push(appInstance);

      executeInstanceAddedListeners(foundApp, appInstance);
      //this will only be available once the app registration passes
      if (foundApp.registrationCompleted) {
        loadAppInstance(foundApp, appInstance);
      }

      return appInstance;
    };
  }
}
