import type { SPFxExtensionAppConfig } from "./appConfig";
import type {
  SPFxExtensionAppEventCleanup,
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
} from "./events";


/**
 * A method that will be called by Core when app is unmounted
 */
export type SPFxExtensionAppCleanup = () => void;

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

  /**
   * Calls cleanup function provided by `onInstanceRequested` method of the app definition.
   * 
   * Removes all app event listeners.
   */
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
  allEventListeners: SPFxExtensionAppInstanceEventListener[];
  /**
   * this ensures that webpart config change events are only called on the instance when its loaded
   */
  instanceLoadPromise: Promise<void>;
  /**
   * this should only be called by the core when instance is loaded and the promise is used by spfx
   */
  instanceLoadPromiseResolver(value?: any): void;
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
   * 
   * This also means it wont be automatically executed by spfx.
   * 
   * You will have to call `window.__SPFxExtensions.InstantiateApp` method to run the app.
   */
  isWebPartApp: boolean;
  /**
   * Hide app selection dropdown in property pane when app is loaded
   */
  hideAppSelectorWhenAppLoaded?: boolean;

  /**
   * If set to true, the "Open Configurator" button will be hidden in the property pane
   */
  hideConfiguratorButton?: boolean;

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
  onInstanceRequested?(newInstance: SPFxExtensionAppInstance): Promise<SPFxExtensionAppCleanup>;
}

export type SPFxExtensionAppRegistration = Omit<SPFxExtensionAppDefinition, "instances">;
