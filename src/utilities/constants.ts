export const IS_WORKBENCH =
  window.location.host.toLowerCase().indexOf("/_layouts/15/workbench.aspx") >
  -1;

export const IS_MODERN_EXPIRIENCE = !!!window._spBodyOnLoadFunctions;
export const SPFxExtensionCore = "[SPFxExtensionCore]" as const;
export const IS_SPO = window.location.host.includes(".sharepoint.com");

