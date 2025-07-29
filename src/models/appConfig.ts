export interface SPFxExtensionAppSearchableData {
  searchableText?: string;
  searchableHtml?: string;
}
export interface SPFxExtensionAppConfig {
  type: string;
  [key: string]: any;
}

export interface SPFxExtensionAppPropertyPaneConfigRender {
  domElement: HTMLElement;
}

export interface SPFxExtensionAppRuntimeConfig {
  domElement?: HTMLElement;
  /**
   * @deprecated use `webpart.context` instead
   */
  webpartContext?: any;
  webpart?: any;
  openPropertyPane?(): void;
  closePropertyPane?(): void;
  isPropertyPaneOpen?(): boolean;
  /**
   * Saves configuration inside the webpart
   * @param config Webpart Configuration that you want to save
   * @param raiseEvent If set to true, it will raise onConfigurationChange event. Default: `true`
   */
  saveConfigValue?(config: SPFxExtensionAppConfig, raiseEvent?: boolean): void;
  getConfigValue?(key?: string): SPFxExtensionAppConfig | undefined;
  getSearchableData?(): SPFxExtensionAppSearchableData;
  setSearchableData?(data: SPFxExtensionAppSearchableData): void;
  /**
   * @param actions Actions that you want to set as top actions in the top action bar
   * Check `ITopActionsField` from `@microsoft/sp-top-actions` package for more details.
   */
  setTopActions?(actions: any[]): void;
  getTopActions?(): any[];
  /**
   * Can be used to get the theme from SPFx (fluentui) and reuse it in the app.
   */
  getThemeProvider?(): any;
  /**
   * Once property pane is rendered this method will return the DOM element of the property pane which can be used to render custom controls.
   */
  getConfigDomElement?(): HTMLElement | undefined;
}
