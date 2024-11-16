import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { SPFxExtensionCore } from "../../utilities/constants";

export function logGenericCore(...args: any[]) {
    console.log(SPFxExtensionCore, ...args);
}
export function logGenericCoreError(...args: any[]) {
    console.error(SPFxExtensionCore, ...args);
}
export function logGenericCoreWarning(...args: any[]) {
    console.warn(SPFxExtensionCore, ...args);
}

export function logGenericCoreInfo(...args: any[]) {
    console.info(SPFxExtensionCore, ...args);
}

export function logGenericCoreDebug(...args: any[]) {
    console.debug(SPFxExtensionCore, ...args);
}


export function logInstanceRequestedError(app: SPFxExtensionAppDefinition, e: any, additionalData?: string) {
    logGenericCoreError(
        "Error while executing onInstanceRequested for app",
        app.id,
        "with name",
        app.name,
        additionalData ? `Additional Data: ${additionalData}` : "",
        e,
    );
}