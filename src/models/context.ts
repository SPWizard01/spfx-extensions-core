export interface SPFxExtensionAppContextInjection {
  location: {
    href: string;
  };
  context?: any;
  spModuleLoader: {
    start(ctx: any, failureFunc: Function): Promise<void>;
  };
}

export interface SPOnlineContextInjection {
    context?: any;
    start(ctx: any): Promise<void>;
  }
  