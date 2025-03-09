import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { SPFxExtensionAppInstance } from "../models/appModel";

import { Index } from "./components";

interface AppProps {
  instance: SPFxExtensionAppInstance;
}

export function App(_props: AppProps) {
  return (
    <FluentProvider theme={webLightTheme}>
      <Index />
    </FluentProvider>
  );
}
