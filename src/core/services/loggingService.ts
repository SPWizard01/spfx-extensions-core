import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { SPFxExtensionCore } from "../../utilities/constants";
import { greenBright } from "../utility/colors";

export function logGenericCore(...args: any[]) {
  console.log(
    greenBright(SPFxExtensionCore),
    new Date().toISOString(),
    ...args
  );
}
export function logGenericCoreError(...args: any[]) {
  console.error(
    greenBright(SPFxExtensionCore),
    new Date().toISOString(),
    ...args
  );
}
export function logGenericCoreWarning(...args: any[]) {
  console.warn(
    greenBright(SPFxExtensionCore),
    new Date().toISOString(),
    ...args
  );
}
export function logGenericCoreTrace(...args: any[]) {
  console.trace(
    greenBright(SPFxExtensionCore),
    new Date().toISOString(),
    ...args
  );
}
export function logGenericCoreInfo(...args: any[]) {
  console.info(
    greenBright(SPFxExtensionCore),
    new Date().toISOString(),
    ...args
  );
}

export function logGenericCoreDebug(...args: any[]) {
  console.debug(
    greenBright(SPFxExtensionCore),
    new Date().toISOString(),
    ...args
  );
}

export function logInstanceRequestedError(
  app: SPFxExtensionAppDefinition,
  e: any,
  additionalData?: string
) {
  logGenericCoreError(
    "Error while executing onInstanceRequested for app",
    app.id,
    "with name",
    app.name,
    additionalData ? `Additional Data: ${additionalData}` : "",
    e
  );
}
