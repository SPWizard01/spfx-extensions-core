import { createRoot, type Root } from 'react-dom/client';
import type { SPFxExtensionAppInstance } from "../models/appModel";
import { App } from './app';

export async function launch(instance: SPFxExtensionAppInstance) {
    let root: Root | undefined = undefined;
    if (instance.element) {
        root = createRoot(instance.element);
        root.render(App({ instance }));
    }
    return () => {
        root?.unmount();
    }
}

// "@fluentui/web-components": "3.0.0-beta.73",
// "@microsoft/fast-element": "2.0.0",