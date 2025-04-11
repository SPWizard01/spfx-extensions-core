import { DEBUG_KEYS } from "../utilities/debug";

const debugPort = Number(localStorage.getItem(DEBUG_KEYS.SPFXEXT_CORE));
const isDebugging = debugPort > 0;

function addScriptElement(src: string) {
  const elem = document.createElement("script");
  elem.type = "module";
  elem.src = src;
  document.head.appendChild(elem);
}

const classicWrapperLocation = isDebugging
  ? `https://localhost:${debugPort}/__spfxWrapperClassic.js?v=${Date.now()}`
  : "/sites/appcatalog/CDN/SPFxExtensionAppsCore/coreClassicWrapper.js";

addScriptElement(classicWrapperLocation);
