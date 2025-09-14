import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
  SPFxExtensionAppInstanceBase,
  SPFxExtensionAppRuntimeConfig,
  SPFxExtensionEnsuredAppDefinition,
} from "../../models/appModel";
import type { SPFxExtensionAppCustomizerInstance } from "../../models/appModelAppCustomizer";
import type { SPFxExtensionAppAdaptiveCardInstance } from "../../models/appModelCard";
import type { SPFxExtensionAppWebpartInstance } from "../../models/appModelWebpart";
import type {
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
} from "../../models/events";
import { emptyDummy, getCurrentContextId } from "../../utilities/helpers";
import { ensureApp } from "./appDefinitionService";
import { loadAppInstance } from "./appServices";
import { logGenericCoreDebug, logGenericCoreError } from "./loggingService";

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
  appDefinition: SPFxExtensionEnsuredAppDefinition,
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

export function createAppInstance(runTimeConfig: SPFxExtensionAppRuntimeConfig) {
  const { promise: instanceLoadPromise, resolve: instanceLoadPromiseResolver } =
    Promise.withResolvers<void>();

  // Common base props shared by all instance types (added after SPFx runtime config spread)
  const baseCommon: SPFxExtensionAppInstanceBase = {
    key: window.crypto.randomUUID(),
    contextId: getCurrentContextId(),
    instanceRequested: false,
    instanceExecuted: false,
    unmountOnRender: true as boolean,
    unmount: emptyDummy,
    allEventListeners: [],
    addEventListener: emptyDummy,
    executeListeners: emptyDummy,
    instanceLoadPromise,
    instanceLoadPromiseResolver,
  };

  let appInstance: SPFxExtensionAppInstance;

  switch (runTimeConfig.instanceType) {
    case "adaptiveCard": {
      const adaptive: SPFxExtensionAppAdaptiveCardInstance = {
        ...baseCommon,
        ...runTimeConfig,
      };
      appInstance = adaptive;
      break;
    }
    case "webpart": {
      // Maintain simple in-memory store for top actions until user code overrides
      const webpart: SPFxExtensionAppWebpartInstance = {
        ...baseCommon,
        ...runTimeConfig,
      }; // cast to satisfy additional props expectation
      appInstance = webpart;
      break;
    }
    case "appCustomizer": {
      const customizer: SPFxExtensionAppCustomizerInstance = {
        ...baseCommon,
        ...runTimeConfig,
      };
      appInstance = customizer;
      break;
    }
    default: {
      // Fallback for future instance types – keep strong error visibility
      throw new Error(
        `Unsupported instance type '${(runTimeConfig as any).instanceType}' while creating app instance.`
      );
    }
  }

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
        await loadAppInstance(foundApp, appInstance);
      }

      return appInstance;
    };
  }
}
