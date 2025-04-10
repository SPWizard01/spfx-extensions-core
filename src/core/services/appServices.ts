import type { SPFxExtensionAppDefinition, SPFxExtensionAppInstance } from "../../models/appModel";
import { logInstanceRequestedError } from "./loggingService";

export function unmountAppInstance(
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

export async function unmountInstancesOnContextChange() {
    for (const alreadyRegisteredApp of window.__SPFxExtensions.Apps) {
        if (alreadyRegisteredApp.keepOnContextChange) continue;
        for (const appInstance of alreadyRegisteredApp.instances) {
            appInstance.unmount?.();
        }
    }
}

export function loadAppInstance(foundApp: SPFxExtensionAppDefinition, appInstance: SPFxExtensionAppInstance) {
    try {
        appInstance.isLoaded = true;
        foundApp.onInstanceRequested?.(appInstance).then((cleanup) => {
            appInstance.instanceLoadPromiseResolver();
            appInstance.unmount = () => {
                cleanup();
                unmountAppInstance(foundApp, appInstance);
            }
        }).catch((e) => {
            logInstanceRequestedError(foundApp, e);
        });
    }
    catch (e) {
        logInstanceRequestedError(foundApp, e);
    }
}