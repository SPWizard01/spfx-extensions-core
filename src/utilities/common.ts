
export function isESM(this: any) {
  return this === undefined;
}

export async function fetchAndEvalAsset(url: string) {
  console.debug("Requesting: " + url);
  let srcText = "";
  try {
    const req = await fetch(url);
    srcText = await req.text();
  } catch (err) {
    console.error(`Unable to fetch from ${url}. Error: `, err);
  }
  if (!srcText) {
    throw `Nothing was returned from ${url}`;
  }
  if (srcText) {
    try {
      console.debug("Eval: " + url);
      eval(srcText);
    } catch (err) {
      throw "Error while evaluating script.";
    }
  }
}

export function isSPO() {
  return window.location.host.includes(".sharepoint.com");
}

export function initializeFluentIcons(
  initializer: (url?: string, cfg?: any) => void,
  url?: string,
  cfg?: any
) {
  if (window.__SPFxExtensions.Utils.fluentIconsInitialized) {
    return;
  }
  initializer(url, cfg);
  window.__SPFxExtensions.Utils.fluentIconsInitialized = true;
}
