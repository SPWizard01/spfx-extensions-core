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
  openPropertyPane?(): void;
  closePropertyPane?(): void;
  isPropertyPaneOpen?(): boolean;
  /**
   * Saves configuration inside the webpart
   * @param config Webpart Configuration that you want to save
   * @param raiseEvent If set to true, it will raise onConfigurationChange event. Default: `true`
   */
  saveConfigValue?(config: SPFxExtensionAppConfig, raiseEvent?: boolean): void;
  getConfigValue?(): SPFxExtensionAppConfig | undefined;
  getSearchableData?(): SPFxExtensionAppSearchableData;
  setSearchableData?(data: SPFxExtensionAppSearchableData): void;
  webpartContext?: any;
}
