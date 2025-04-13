import {
  createDarkTheme,
  createLightTheme,
  FluentProvider,
} from "@fluentui/react-components";
import { createBrandVariants } from "@fluentui/react-migration-v8-v9";
import type { SPFxExtensionAppInstance } from "../models/appModel";
import { Index } from "./components";

interface AppProps {
  instance: SPFxExtensionAppInstance;
}

const variants = createBrandVariants(
  window.__globalSettings__.customizations.settings.theme.palette
);
const thm = window.__globalSettings__.customizations.settings.theme.isInverted
  ? createDarkTheme(variants)
  : createLightTheme(variants);

document
  .querySelector("#spCommandBar button[name='Edit']")
  ?.setAttribute("style", "display:none;");

// const thm = createV9Theme(window.__themeState__.theme)
export function App(_props: AppProps) {
  return (
    <FluentProvider
      theme={thm}
      style={{
        height: "100%",
      }}
    >
      <Index />
    </FluentProvider>
  );
}
