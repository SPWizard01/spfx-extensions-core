import {
  FluentProvider,
  makeStyles,
  Title2,
  Title3,
  tokens,
  webLightTheme,
} from "@fluentui/react-components";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import type { SPFxExtensionAppInstance } from "../models/appModel";

import { Index } from "./components";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";

interface AppProps {
  instance: SPFxExtensionAppInstance;
}
const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();

export function App(props: AppProps) {
  return (
    <FluentProvider theme={webLightTheme}>
      <Index />
    </FluentProvider>
  );
}
