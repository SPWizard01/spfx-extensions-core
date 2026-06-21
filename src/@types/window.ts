import type { Theme } from "@fluentui/theme";

declare global {
  interface Window {
    __keyborg: any;
    __keyborgData: any;
    __tabsterInstance: any;
    __tabsterInstanceContext: any;
    __tabsterShadowDOMAPI: any;
    __globalSettings__: {
      customizations: {
        settings: {
          theme: Theme;
        };
      };
    };
  }
}
