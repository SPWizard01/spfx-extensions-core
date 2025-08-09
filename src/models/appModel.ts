import type { SPFxExtensionAppRuntimeConfig } from "./appConfig";
import type {
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
  SPFxExtensionCleanup,
} from "./events";

export interface SPFxExtensionAppInstance extends SPFxExtensionAppRuntimeConfig {
  key: string;

  contextId: string;
  /**
   * Determines whether the app wants to be unmounted when render method is called.
   */
  unmountOnRender: boolean;
  /**
   * Ensures that subsiquent `onInstanceRequested` are not called for the same instance.
   *
   * Used by context change event where app registration remains but new instances might be created.
   */
  instanceRequested: boolean;
  /**
   * Only set to true if onInstanceRequested was called without errors.
   */
  instanceExecuted: boolean;
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
    K extends keyof SPFxExtensionAppInstanceEvents = keyof SPFxExtensionAppInstanceEvents,
  >(
    eventName: K,
    callback: (eventData: SPFxExtensionAppInstanceEvents[K]) => void
  ): SPFxExtensionCleanup;

  // removeEventListener(listener: SPFxExtensionAppInstanceEventListener): void;

  executeListeners<
    K extends keyof SPFxExtensionAppInstanceEvents = keyof SPFxExtensionAppInstanceEvents,
  >(
    eventName: K,
    eventData: SPFxExtensionAppInstanceEvents[K]
  ): void;
  allEventListeners: SPFxExtensionAppInstanceEventListener[];
  /**
   * this ensures that webpart config change events are only called on the instance when its loaded
   */
  instanceLoadPromise: Promise<void>;
  /**
   * this should only be called by the core when instance is loaded and the promise is used by spfx
   */
  instanceLoadPromiseResolver(): void;
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
   * You will have to call `window.__SPFxExtensions.InstantiateApp` method to run the app.
   * 
   * Or set `autoExecute` to true;
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
   * If set to true, the app will not be unmounted when the SPO context changes and app belongs to that context.
   *
   * Usefull for apps that do not need to be unmounted when the context changes. i.e. styles/footer etc.
   * 
   * Only applicable for apps that have `isWebPartApp` set to `false`.
   *
   * It will still be unmounted regardless of this flag if the app does not belong (not allowed) to the new context.
   */
  keepOnContextChange?: boolean;

  /**
   * If set to true, the app will be automatically executed when the app is registered.
   * 
   * Only applicable when `isESM` is set to true is set in the manifest
   */
  autoExecute?: boolean;
  /**
   * If set to a value greater than 0, Core will only `autoExecute` when instance count is less than this value.
   * 
   * Setting this to undefined will allow unlimited instances of the app to be created.
   * 
   * Setting this to 0 will prevent any instances of the app to be created.
   */
  maxInstances?: number;
  /**
   * If set to true, the app will be unmounted when the app is re-rendered.
   * 
   * If set to false the app instance will be informed with `onRender` event
   * that the webpart is re-rendered and it can decide what to do.
   * 
   * Only applicable for apps that have `isWebPartApp` set to `true`.
   * 
   * Default value is `true`.
   */
  unmountOnRender?: boolean;
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
   *
   * This method is also called by the SPFx and Core solutions.
   *
   * @param newInstance The instance that is created usually by `window.__SPFxExtensions.InstantiateApp` call if you do not own the app.
   */
  onInstanceRequested(
    newInstance: SPFxExtensionAppInstance
  ): Promise<SPFxExtensionCleanup>;
}

export type SPFxExtensionAppRegistration = Omit<
  SPFxExtensionAppDefinition,
  "instances"
>;

export interface SPFxExtensionEnsuredAppDefinition
  extends SPFxExtensionAppDefinition {
  registrationCompleted: boolean;
}
