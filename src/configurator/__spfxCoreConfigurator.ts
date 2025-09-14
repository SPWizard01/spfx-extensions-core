import { render } from "preact";
import type { SPFxExtensionAppWebpartInstance } from "../models/appModelWebpart";
import { App } from "./app";

if (DEBUG) {
  import("preact/debug");
}
export async function launch(instance: SPFxExtensionAppWebpartInstance) {
  render(App({ instance }), instance.domElement);
  return () => {
    render(null, instance.domElement);
  };
}

// "@fluentui/web-components": "3.0.0-beta.73",
// "@microsoft/fast-element": "2.0.0",
