(async () => {
  const debugPort = Number(localStorage.getItem("SPFXEXT"));
  const isDebugging = debugPort > 0;
  const classicWrapperLocation = isDebugging
    ? `https://localhost:${debugPort}/__spfxWrapperClassic.js?v=${Date.now()}`
    : `/sites/appcatalog/ClientSideAssets/ff36e5d0-f7c7-421d-9e21-0a422626209a/spfx-extension-wrapper.js?v=${Date.now()}`;
  try {
    const module = await import(classicWrapperLocation);
    module.init();
  }
  catch (e) {
    console.error("Error loading classic wrapper", e);
  }
})();