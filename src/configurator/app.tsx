import {
  FluentProvider,
  createLightTheme
} from "@fluentui/react-components";
import {
  createBrandVariants,
  createV9Theme,
} from "@fluentui/react-migration-v8-v9";
import type { SPFxExtensionAppInstance } from "../models/appModel";
import { Index } from "./components";

interface AppProps {
  instance: SPFxExtensionAppInstance;
}
const variants = createBrandVariants(window.__globalSettings__.customizations.settings.theme.palette)
let thm = createLightTheme(variants)
window.__globalSettings__.customizations.settings.theme = {
  ...window.__globalSettings__.customizations.settings.theme,
  set palette(pv) {
    console.log("palette set", pv)
  },
  get pallete() {
    console.log("palette get")
    return window.__globalSettings__.customizations.settings.theme.palette
  }
}
// const thm = createV9Theme(window.__themeState__.theme)
export function App(_props: AppProps) {
  return (
    <FluentProvider theme={thm}>
      <Index />
    </FluentProvider>
  );
}
