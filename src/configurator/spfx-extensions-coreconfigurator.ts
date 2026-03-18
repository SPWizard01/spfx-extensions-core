import { render } from "preact";
import type { SPFxExtensionAppInstance } from "../models/appModel";
import { App } from "./app";
if (DEBUG) {
  import("preact/debug");
}
export async function launch(instance: SPFxExtensionAppInstance) {
  if (instance.domElement) {
    render(App({ instance }), instance.domElement);
  }
  return () => {
    if (instance.domElement) {
      render(null, instance.domElement);
    }
  };
}

// "@fluentui/web-components": "3.0.0-beta.73",
// "@microsoft/fast-element": "2.0.0",
