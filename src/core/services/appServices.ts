import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppDefinitionBase,
  SPFxExtensionAppInstance,
} from "../../models/appModel";
import type { SPFxExtensionCleanup } from "../../models/events";
import { logGenericCoreError, logInstanceRequestedError } from "./loggingService";

export function unmountAppInstance(
  appDef: SPFxExtensionAppDefinitionBase,
  instanceKey: string,
  userCleanupFunc?: () => void
) {
  const idx = appDef.instances.findIndex((i) => i.key === instanceKey);
  if (idx > -1) {
    const splicedInstance = appDef.instances.splice(idx, 1);
    if (splicedInstance.length < 1) return;
    const instance = splicedInstance[0];
    instance.executeListeners("onConfigurationClose", { domElement: undefined });
    instance.allEventListeners.splice(0, instance.allEventListeners.length);
    userCleanupFunc?.();
  }
}

export async function unmountInstancesOnContextChange(contextId: string) {
  const instancesToUnmount = window.__SPFxExtensions.Apps.filter(
    (a) => a.instanceType !== "webpart" && !a.keepOnContextChange
  );
  for (const alreadyRegisteredApp of instancesToUnmount) {
    for (const appInstance of alreadyRegisteredApp.instances.filter(
      (i) => i.contextId !== contextId
    )) {
      if (appInstance.instanceExecuted) {
        appInstance.unmount();
      }
    }
  }
}

export async function loadAppInstance(
  foundApp: SPFxExtensionAppDefinition,
  appInstance: SPFxExtensionAppInstance
) {
  if (appInstance.instanceRequested) return;
  try {
    appInstance.instanceRequested = true;

    let instancePromise: Promise<SPFxExtensionCleanup> | undefined;

    switch (true) {
      case foundApp.instanceType === "webpart" && appInstance.instanceType === "webpart": {
        instancePromise = foundApp.onInstanceRequested(appInstance);
        break;
      }
      case foundApp.instanceType === "adaptiveCard" &&
        appInstance.instanceType === "adaptiveCard": {
        instancePromise = foundApp.onInstanceRequested(appInstance);
        break;
      }
      case foundApp.instanceType === "appCustomizer" &&
        appInstance.instanceType === "appCustomizer": {
        instancePromise = foundApp.onInstanceRequested(appInstance);
        break;
      }
      default: {
        throw new Error(
          `Instance type mismatch: app definition is '${foundApp.instanceType}' got instance: '${appInstance.instanceType}'`
        );
      }
    }
    if (!instancePromise) {
      logGenericCoreError("onInstanceRequested", "No instance promise returned");
      return;
    }
    const userCleanupFunc = await instancePromise;
    appInstance.unmount = () => {
      unmountAppInstance(foundApp, appInstance.key, userCleanupFunc);
    };
    appInstance.instanceLoadPromiseResolver();
    appInstance.instanceExecuted = true;
  } catch (e) {
    logInstanceRequestedError(foundApp, e);
  }
}
