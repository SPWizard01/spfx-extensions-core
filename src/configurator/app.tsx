import {
    Button,
    FluentProvider,
    webLightTheme,
} from "@fluentui/react-components";
import { StrictMode } from "react";
import type { SPFxExtensionAppInstance } from "../models/appModel";

interface AppProps {
  instance: SPFxExtensionAppInstance;
}

export function App(props: AppProps) {
  return (
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <div>
          <h1>Configurator</h1>
        </div>
      </FluentProvider>
    </StrictMode>
  );
}
