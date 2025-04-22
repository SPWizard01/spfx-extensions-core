import { logGenericCoreWarning } from "../core/services/loggingService";

export function emptyDummy() {
  logGenericCoreWarning(
    "The app instance event was called before app instance was initialized."
  );
  return () => {};
};

let currentContext = window.crypto.randomUUID();
export function getCurrentContextId() {
    return currentContext;
}
export function getNewContext() {
    currentContext = window.crypto.randomUUID();
    return currentContext;
}

export function extractGUIDFromString(str: string) {
//   const guidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
//   const match = str.match(guidRegex);
//   return match ? match[0] : undefined;
    return str.replace("{","").replace("}","");
}


export function cloneObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}