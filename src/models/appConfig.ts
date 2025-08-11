export interface SPFxExtensionAppSearchableData {
  searchableText?: string;
  searchableHtml?: string;
}

// If no generic is provided, ensure the config is at least an object with a mandatory 'type' field.
// Using `unknown` prevents widening to `any` via intersection and results in `{ type: string }` by default.
export type SPFxExtensionAppConfig<T = unknown> = {
  type: string;
} & T;

export interface SPFxExtensionAppPropertyPaneConfigRender {
  domElement: HTMLElement;
}

export interface SPFxExtensionAppRuntimeConfig<TConfig = unknown> {
  domElement?: HTMLElement;
  webpart?: any;
  openPropertyPane?(): void;
  closePropertyPane?(): void;
  isPropertyPaneOpen?(): boolean;
  /**
   * Saves configuration inside the webpart
   * @param config Webpart Configuration that you want to save
   * @param raiseEvent If set to true, it will raise onConfigurationChange event. Default: `true`
   */
  saveConfigValue?(config: SPFxExtensionAppConfig<TConfig>, raiseEvent?: boolean): void;
  getConfigValue?(key?: string): SPFxExtensionAppConfig<TConfig> | undefined;
  getSearchableData?(): SPFxExtensionAppSearchableData;
  setSearchableData?(data: SPFxExtensionAppSearchableData): void;
  /**
   * @param actions Actions that you want to set as top actions in the top action bar
   * Check `ITopActionsField` from `@microsoft/sp-top-actions` package for more details.
   *
   * https://learn.microsoft.com/en-us/javascript/api/sp-top-actions/itopactionsfield?view=sp-typescript-latest
   */
  setTopActions?(actions: any[]): void;
  /**
   * Check `ITopActionsField` from `@microsoft/sp-top-actions` package for more details.
   *
   * https://learn.microsoft.com/en-us/javascript/api/sp-top-actions/itopactionsfield?view=sp-typescript-latest
   */
  getTopActions?(): any[];
  /**
   * Can be used to get the theme from SPFx (FluentUI) and reuse it in the app.
   * Check `ThemeProvider` from `@microsoft/sp-component-base` package for more details.
   *
   * https://learn.microsoft.com/en-us/javascript/api/sp-component-base/themeprovider?view=sp-typescript-latest
   */
  getThemeProvider?(): any;
  /**
   * Once property pane is rendered this method will return the DOM element of the property pane which can be used to render custom controls.
   */
  getConfigDomElement?(): HTMLElement | undefined;
  /**
   * Get webpart context in SPFx this would be `this.context`
   * Check `WebPartContext` from `@microsoft/sp-webpart-base` package for more details.
   *
   * https://learn.microsoft.com/en-us/javascript/api/sp-webpart-base/webpartcontext?view=sp-typescript-latest
   */
  getContext?(): any | undefined;
  /**
   * Get service scope in SPFx this would be `this.context.serviceScope`
   * Check `ServiceScope` from `@microsoft/sp-core-library` package for more details.
   *
   * https://learn.microsoft.com/en-us/javascript/api/sp-core-library/servicescope?view=sp-typescript-latest
   */
  getServiceScope?(): any | undefined;
}
