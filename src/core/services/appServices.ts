import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
} from "../../models/appModel";
import { logInstanceRequestedError } from "./loggingService";

export function unmountAppInstance(
  appDef: SPFxExtensionAppDefinition,
  instanceKey: string,
  userCleanupFunc?: () => void
) {
  const idx = appDef.instances.findIndex((i) => i.key === instanceKey);
  if (idx > -1) {
    const splicedInstance = appDef.instances.splice(idx, 1);
    if (splicedInstance.length < 1) return;
    const instance = splicedInstance[0];
    if (instance.isLoaded) {
      instance.executeListeners("onConfigurationClose", undefined);
      instance.allEventListeners.splice(0, instance.allEventListeners.length);
      userCleanupFunc?.();
    }
  }
}

export async function unmountInstancesOnContextChange() {
  for (const alreadyRegisteredApp of window.__SPFxExtensions.Apps) {
    if (alreadyRegisteredApp.keepOnContextChange) continue;
    for (const appInstance of alreadyRegisteredApp.instances) {
      appInstance.unmount();
    }
  }
}

export function loadAppInstance(
  foundApp: SPFxExtensionAppDefinition,
  appInstance: SPFxExtensionAppInstance
) {
  try {
    appInstance.isLoaded = true;
    foundApp
      .onInstanceRequested?.(appInstance)
      .then((userCleanupFunc) => {
        appInstance.unmount = () => {
          unmountAppInstance(foundApp, appInstance.key, userCleanupFunc);
        };
        appInstance.instanceLoadPromiseResolver();
      })
      .catch((e) => {
        logInstanceRequestedError(foundApp, e);
      });
  } catch (e) {
    logInstanceRequestedError(foundApp, e);
  }
}
