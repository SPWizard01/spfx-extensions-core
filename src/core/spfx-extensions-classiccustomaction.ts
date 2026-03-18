(async () => {
  const currentScript = document.currentScript as HTMLScriptElement;
  const assetsUrl = "/sites/appcatalog/ClientSideAssets/7d56fff0-e90e-40a7-98cf-fcdbc63a9b01/";
  const wrapperName = "spfx-extensions-classicwrapper.js";
  const spoPath = currentScript?.src ?? assetsUrl;
  if (!currentScript?.src) {
    console.warn(
      "[SPFxExtensions/ClassicCustomAction] Could not determine script source, falling back to default url.",
      assetsUrl
    );
  }
  const baseUrl = spoPath.slice(0, spoPath.lastIndexOf("/") + 1);
  const debugPort = Number(window.localStorage.getItem("SPFXEXT"));
  const isDebugging = debugPort > 0;
  const classicWrapperLocation = isDebugging
    ? `https://localhost:${debugPort}/${wrapperName}?v=${Date.now()}`
    : `${baseUrl}${wrapperName}?v=${Date.now()}`;
  try {
    const module = await import(classicWrapperLocation);
    module.init();
  } catch (e) {
    console.error("Error loading classic wrapper", e);
  }
})();
