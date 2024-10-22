import { initCoreServices } from "./services/initializationService";
import { SPFxExtensionCore } from "../utilities/constants";

export async function start() {
  const buildDate = BUILD_DATE;
  console.info(SPFxExtensionCore, `Initializing Core Services Built:`, buildDate);
  initCoreServices();
}

start();
