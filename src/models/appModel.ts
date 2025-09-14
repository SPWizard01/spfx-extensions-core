import type {
  SPFxExtensionAppCustomizerDefinition,
  SPFxExtensionAppCustomizerInstance,
  SPFxExtensionAppCustomizerRuntimeConfig,
} from "./appModelAppCustomizer";
import type {
  SPFxExtensionAppAdaptiveCardDefinition,
  SPFxExtensionAppAdaptiveCardInstance,
  SPFxExtensionAppAdaptiveCardRuntimeConfig,
} from "./appModelCard";
import type {
  SPFxExtensionAppWebpartDefinition,
  SPFxExtensionAppWebpartInstance,
  SPFxExtensionAppWebpartRuntimeConfig,
} from "./appModelWebpart";
import type {
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppInstanceEvents,
  SPFxExtensionCleanup,
} from "./events";

export type SPFxExtensionAppInstanceType = "webpart" | "adaptiveCard" | "appCustomizer";
export interface SPFxExtensionAppIcon {
  iconType: "svg" | "font" | "url";
  iconData: string;
  fontFamily?: string;
}

export interface SPFxExtensionAppInstanceRequestedDetails<T = SPFxExtensionAppInstance> {
  /**
   * Called once an instance of the app was created and app is registered.
   *
   * This method is also called by the SPFx and Core solutions.
   *
   * @param newInstance The instance that is created usually by `window.__SPFxExtensions.InstantiateApp` call if you do not own the app.
   */
  onInstanceRequested(newInstance: T): Promise<SPFxExtensionCleanup>;
}

export interface SPFxExtensionAppInstanceBase<TConfig = unknown> {
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
    K extends
      keyof SPFxExtensionAppInstanceEvents<TConfig> = keyof SPFxExtensionAppInstanceEvents<TConfig>,
  >(
    eventName: K,
    callback: (eventData: SPFxExtensionAppInstanceEvents<TConfig>[K]) => void
  ): SPFxExtensionCleanup;

  // removeEventListener(listener: SPFxExtensionAppInstanceEventListener): void;

  executeListeners<
    K extends
      keyof SPFxExtensionAppInstanceEvents<TConfig> = keyof SPFxExtensionAppInstanceEvents<TConfig>,
  >(
    eventName: K,
    eventData: SPFxExtensionAppInstanceEvents<TConfig>[K]
  ): void;
  allEventListeners: SPFxExtensionAppInstanceEventListener<TConfig>[];
  /**
   * This ensures that all relevant calls are called once onInstanceRequested is completed
   */
  instanceLoadPromise: Promise<void>;
  /**
   * This should only be called by the core when instance is loaded and the promise is used by spfx
   */
  instanceLoadPromiseResolver(): void;
}

export interface SPFxExtensionAppDefinitionBase {
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
   * If set to true, the app will not show in webpart picker
   */
  hideWebPartButton?: boolean;
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
   * Useful for apps that do not need to be unmounted when the context changes. i.e. styles/footer etc.
   *
   * Only applicable for apps that have `instanceType` set to `appCustomizer`.
   *
   * It will still be unmounted regardless of this flag if the app does not belong (not allowed) to the new context.
   */
  keepOnContextChange?: boolean;

  /**
   * Should be set to true when calling `window.__SPFxExtensions.RegisterApp` method inside manual registration, otherwise it will be unregistered automatically.
   */
  isManual?: boolean;
  /**
   * If set to true, the app will be automatically executed when the app is registered.
   *
   * Only applicable for non-manually added apps
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
}

export type SPFxExtensionAppRuntimeConfig =
  | SPFxExtensionAppWebpartRuntimeConfig
  | SPFxExtensionAppCustomizerRuntimeConfig
  | SPFxExtensionAppAdaptiveCardRuntimeConfig;

export type SPFxExtensionAppInstance<TConfig = unknown> =
  | SPFxExtensionAppCustomizerInstance<TConfig>
  | SPFxExtensionAppWebpartInstance<TConfig>
  | SPFxExtensionAppAdaptiveCardInstance<TConfig>;

export type SPFxExtensionAppDefinition =
  | SPFxExtensionAppWebpartDefinition
  | SPFxExtensionAppAdaptiveCardDefinition
  | SPFxExtensionAppCustomizerDefinition;

type SPFxExtensionAppCustomizerRegistration = Omit<
  SPFxExtensionAppCustomizerDefinition,
  "instances"
>;
type SPFxExtensionAppWebpartRegistration = Omit<SPFxExtensionAppWebpartDefinition, "instances">;
type SPFxExtensionAppAdaptiveCardRegistration = Omit<
  SPFxExtensionAppAdaptiveCardDefinition,
  "instances"
>;

export type SPFxExtensionAppRegistration =
  | SPFxExtensionAppCustomizerRegistration
  | SPFxExtensionAppWebpartRegistration
  | SPFxExtensionAppAdaptiveCardRegistration;

export type SPFxExtensionEnsuredAppDefinitionCompleted = SPFxExtensionAppDefinition & {
  registrationCompleted: true;
};

export type SPFxExtensionEnsuredAppDefinitionWaiting = SPFxExtensionAppDefinitionBase & {
  instanceType?: SPFxExtensionAppInstanceType;
  registrationCompleted: false;
};

export type SPFxExtensionEnsuredAppDefinition =
  | SPFxExtensionEnsuredAppDefinitionCompleted
  | SPFxExtensionEnsuredAppDefinitionWaiting;
