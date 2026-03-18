export interface SPFxExtensionModuleLoadResult {
  module: any;
  isModuleAvailable: boolean;
}

export interface SPFxExtensionImportCallback {
  key: string;
  modulePromise: Promise<any>;
  modulePromiseResolver(module: SPFxExtensionModuleLoadResult): void;
}
