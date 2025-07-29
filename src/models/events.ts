import type {
  SPFxExtensionAppConfig,
  SPFxExtensionAppPropertyPaneConfigRender,
} from "./appConfig";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
} from "./appModel";
import type { ContextChangeEventDetails } from "./customEvents";
import type { CompatibleDisplayMode } from "./environment";

/**
 * A method that can be called to remove the registered Event Listener for the instance.
 * It will be called automatically on app unmount. Unless you want to call it earlier.
 */
export type SPFxExtensionAppEventCleanup = () => void;
export type SPFxExntensiononTopActionEvent = {
  actionName: string;
  updatedValue: any;
}
export type SPFxExtensionAppInstanceEvents = {
  onConfigurationRender: SPFxExtensionAppPropertyPaneConfigRender;
  onConfigurationClose: Partial<SPFxExtensionAppPropertyPaneConfigRender>;
  onConfigurationChange: SPFxExtensionAppConfig;
  onDisplayModeChange: CompatibleDisplayMode;
  contextChange: ContextChangeEventDetails;
  contextRefresh: ContextChangeEventDetails;
  onPlaceholdersChanged: any;
  onThemeChange: any;
  onTopActionExecute: SPFxExntensiononTopActionEvent;
  onAppCustomizerDisposed: undefined;
  onRender: undefined;
};

export type SPFxExtensionAppInstanceEventListener = {
  key: string;
  eventName: keyof SPFxExtensionAppInstanceEvents;
  handler(eventData?: any): void;
};

export type SPFxExtensionAppEvents = {
  appAdded: SPFxExtensionAppDefinition;
  instanceAdded: {
    app: SPFxExtensionAppDefinition;
    instance: SPFxExtensionAppInstance;
  };
};

export type SPFxExtensionAppEventListener = {
  key: string;
  eventName: keyof SPFxExtensionAppEvents;
  handler(eventData?: any): void;
};
