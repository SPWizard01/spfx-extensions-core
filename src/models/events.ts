import type {
  SPFxExtensionAppConfig,
  SPFxExtensionAppPropertyPaneConfigRender,
} from "./appConfig";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
} from "./appModel";
import type { CompatibleDisplayMode } from "./environment";

/**
 * A method that can be called to remove the registered Event Listener for the instance.
 * It will be called automatically on app unmount. Unless you want to call it earlier.
 */
export type SPFxExtensionAppEventCleanup = () => void;

export type SPFxExtensionAppInstanceEvents = {
  onConfigurationRender: SPFxExtensionAppPropertyPaneConfigRender;
  onConfigurationClose: undefined;
  onConfigurationChange: SPFxExtensionAppConfig;
  onDisplayModeChange: CompatibleDisplayMode;
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
