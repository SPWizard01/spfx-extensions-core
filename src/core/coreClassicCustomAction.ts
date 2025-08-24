(async () => {
  const debugPort = Number(window.localStorage.getItem("SPFXEXT"));
  const isDebugging = debugPort > 0;
  const classicWrapperLocation = isDebugging
    ? `https://localhost:${debugPort}/__spfxWrapperClassic.js?v=${Date.now()}`
    : `/sites/appcatalog/ClientSideAssets/7d56fff0-e90e-40a7-98cf-fcdbc63a9b01/spfx-extension-wrapper.js?v=${Date.now()}`;
  try {
    const module = await import(classicWrapperLocation);
    module.init();
  } catch (e) {
    console.error("Error loading classic wrapper", e);
  }
})();
