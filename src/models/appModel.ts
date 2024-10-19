import type { SPFxExtensionAppConfig } from "./appConfig";
import type {
  SPFxExtensionAppEventCleanup,
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
} from "./events";

export interface SPFxExtensionApp {
  js: string[];
  css?: string[];
  //potentially other keys that we could handle i.e. fonts etc
}

export interface SPFxExtensionAppManifest {
  [key: string]: SPFxExtensionApp;
}

/**
 * A method that will be called by Core when app is unmounted
 */
export type SPFxExtensionAppCleanup = () => void;

/**
 * A method that starts your application and returns a cleanup method
 */
export type SPFxExtensionAppEntryPoint = (
  instance: SPFxExtensionAppInstance
) => SPFxExtensionAppCleanup;

export type SPFxExtensionAppLaunch = (
  appEntryPoint: SPFxExtensionAppEntryPoint
) => void;

/**
 * Describes a ESM Module that should expose a method that accepts an instance to be launched
 */
export interface SPFxExtensionAppModule {
  /**
   * Should return a method that will be called once the app instance is unmounted
   */
  launch: SPFxExtensionAppEntryPoint;
}

export interface SPFxExtensionAppInstance {
  key: string;
  isLoaded: boolean;
  element?: HTMLElement;

  webpartContext?: any;

  openPropertyPane?(): void;
  closePropertyPane?(): void;
  /**
   * Saves configuration inside the webpart
   * @param config Webpart Configuration that you want to save
   * @param raiseEvent If set to true, it will raise onConfigurationChange event. Default: `true`
   */
  saveConfigValue?(config: SPFxExtensionAppConfig, raiseEvent?: boolean): void;
  getConfigValue?(): SPFxExtensionAppConfig | undefined;

  unmount(): void;

  /**
   * Adds an event listener that will be executed on specific event.
   * Returns cleanup function that you can call to stop receiving events.
   * The function will still be called automatically when app is unmounted.
   * @param eventName name of the event
   * @param callback call back function that will be called once event is raised.
   */
  addEventListener<
    K extends keyof SPFxExtensionAppInstanceEvents,
    R extends SPFxExtensionAppInstanceEvents[K]
  >(
    eventName: K,
    callback: (eventData: R) => void
  ): SPFxExtensionAppEventCleanup;

  // removeEventListener(listener: SPFxExtensionAppInstanceEventListener): void;

  executeListeners<
    K extends keyof SPFxExtensionAppInstanceEvents,
    R extends SPFxExtensionAppInstanceEvents[K]
  >(
    eventName: K,
    eventData: R
  ): void;
  start: SPFxExtensionAppLaunch;
  allEventListeners: SPFxExtensionAppInstanceEventListener[];
  /**
   * this ensures that webpart config change events are only called on the instance when its loaded
   */
  whenLoad: Promise<void>;
  /**
   * this should be called by the instance when instance load is completed
   * this will ensure that webpart which is using this event forwards them only when instance loads
   * @param value will pass value if any
   */
  whenLoadResolve(value?: any): void;
}

export interface SPFxExtensionAppIcon {
  iconType: "svg" | "font" | "url";
  iconData: string;
  fontFamily?: string;
}

export interface SPFxExtensionAppDefinition {
  /**
   * Unique id of an app
   */
  id: string;
  /**
   * Name of an app that would be displayed if `isWebPartApp` was set to `true`
   */
  name: string;
  /**
   * Description that would be displayed in webpart config page
   */
  description: string;
  /**
   * If set to false or undefined the app wont show in webpart picker
   */
  isWebPartApp: boolean;
  /**
   * Hide app selection dropdown in property pane when app is loaded
   */
  hideAppSelectorWhenAppLoaded?: boolean;
  /**
   * Internal registry of all the instances of this app
   */
  instances: SPFxExtensionAppInstance[];
  /**
   * Fluent UI
   */
  icon?: SPFxExtensionAppIcon;

  /**
   * Called once an instance of the app was created and app is registered.
   * @param newInstance The instance that is created usually by `window.__SPFxExtensions.LoadApp` call if you do not own the app.
   *
   * This method is also called by the SPFx and Core solutions.
   */
  onInstanceRequested?(newInstance: SPFxExtensionAppInstance): Promise<void>;
}

export type SPFxExtensionAppRegistration = Omit<SPFxExtensionAppDefinition, "instances">;
