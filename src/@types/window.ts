import type { Theme } from "@fluentui/theme";

declare global {
    interface Window {
        __globalSettings__: {
            customizations: {
                settings: {
                    theme: Theme;
                };
            };
        }
    }
}