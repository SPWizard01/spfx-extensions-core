import type {
  SPFxExtensionAppDefinitionBase,
  SPFxExtensionAppInstanceBase,
  SPFxExtensionAppInstanceRequestedDetails,
} from "./appModel";

/**
 * Will be supplied by SPFx when the app customizer is instantiated
 */
export interface SPFxExtensionAppCustomizerRuntimeConfig {
  instanceType: "appCustomizer";
}

/**
 * Will be supplied by Core when the app customizer instance is created
 */
export interface SPFxExtensionAppCustomizerInstance<TConfig = unknown>
  extends SPFxExtensionAppInstanceBase<TConfig> {
  instanceType: "appCustomizer";
}

type SPFxExtensionAppCustomizerDefinitionBase =
  SPFxExtensionAppInstanceRequestedDetails<SPFxExtensionAppCustomizerInstance> &
    SPFxExtensionAppDefinitionBase;

/**
 * Should be implemented by the user
 */
export interface SPFxExtensionAppCustomizerDefinition
  extends SPFxExtensionAppCustomizerDefinitionBase {
  instanceType: "appCustomizer";
}

export interface SPFxExtensionEnsuredAppCustomizerDefinition
  extends SPFxExtensionAppCustomizerDefinition {
  registrationCompleted: boolean;
}
