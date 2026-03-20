(async () => {
  const currentScript = document.currentScript as HTMLScriptElement;
  const assetsUrl = "/sites/appcatalog/ClientSideAssets/7d56fff0-e90e-40a7-98cf-fcdbc63a9b01/";
  const wrapperName = "spfx-extensions-classicwrapper.js";
  const spoPath = currentScript?.src ?? assetsUrl;
  const SPFXCUSTOMACTIONPREFIX = "[SPFxExtensions/ClassicCustomAction]";
  if (!currentScript?.src) {
    console.warn(
      `${SPFXCUSTOMACTIONPREFIX} Could not determine script source, falling back to default url.`,
      assetsUrl
    );
  }
  const baseUrl = spoPath.slice(0, spoPath.lastIndexOf("/") + 1);
  const lsValue = window.localStorage.getItem("SPFXEXT") ?? "";
  const lsValueIsNumber = /^\d+$/.test(lsValue ?? "");
  const lsValueIsString = lsValue.trim() !== "";
  const t = Date.now();
  let classicWrapperLocation = `${baseUrl}${wrapperName}?v=${t}`;
  if (lsValueIsNumber) {
    classicWrapperLocation = `https://localhost:${lsValue}/${wrapperName}?v=${t}`;
  }
  if (lsValueIsString) {
    classicWrapperLocation = `${lsValue}/${wrapperName}?v=${t}`;
  }
  try {
    const module = await import(classicWrapperLocation);
    module.init();
  } catch (e) {
    console.error(`${SPFXCUSTOMACTIONPREFIX} Error loading classic wrapper`, e);
  }
})();
