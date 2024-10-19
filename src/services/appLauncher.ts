import type {
  SPFxExtensionAppInstance,
  SPFxExtensionAppModule,
} from "../models/appModel";

/**
 * Launches module, registers all required callback inside the core, this is the preferred way to launch the app.
 * @param module
 * @param instance
 */
export function launchSPFxExtensionApp(
  module: SPFxExtensionAppModule,
  instance: SPFxExtensionAppInstance
) {
  if (instance.isLoaded) {
    console.error("Instance has already been loaded", instance);
    return;
  }
  instance.isLoaded = true;
  const moduleUnmountCall = module.launch(instance);
  const coreInstanceUnmount = instance.unmount;
  // this will preserve existing umount callback
  instance.unmount = () => {
    moduleUnmountCall();
    coreInstanceUnmount?.();
  };
  //call load resolve promise to notify that instance has been launched
  instance.whenLoadResolve();
}
