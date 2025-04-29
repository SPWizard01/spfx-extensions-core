import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
} from "../../models/appModel";
import { CONFIGURATOR_APP_ID } from "../../utilities/constants";
import { logGenericCoreDebug, logInstanceRequestedError } from "./loggingService";

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
    instance.executeListeners("onConfigurationClose", undefined);
    instance.allEventListeners.splice(0, instance.allEventListeners.length);
    userCleanupFunc?.();
  }
}

export async function unmountInstancesOnContextChange(contextId: string) {
  const instancesToUnmount = window.__SPFxExtensions.Apps.filter(
    (a) => !a.isWebPartApp && !a.keepOnContextChange && a.id !== CONFIGURATOR_APP_ID
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

export function loadAppInstance(
  foundApp: SPFxExtensionAppDefinition,
  appInstance: SPFxExtensionAppInstance
) {
  if (appInstance.instanceRequested) return;
  try {
    appInstance.instanceRequested = true;
    foundApp
      .onInstanceRequested(appInstance)
      .then((userCleanupFunc) => {
        appInstance.unmount = () => {
          unmountAppInstance(foundApp, appInstance.key, userCleanupFunc);
        };
        appInstance.instanceLoadPromiseResolver();
        appInstance.instanceExecuted = true;
      })
      .catch((e) => {
        logInstanceRequestedError(foundApp, e);
      });
  } catch (e) {
    logInstanceRequestedError(foundApp, e);
  }
}
