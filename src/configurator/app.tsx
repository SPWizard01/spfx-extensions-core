import {
  Button,
  DialogProvider,
  FluentProvider,
  Label,
  Link,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Skeleton,
  SkeletonItem,
  Switch,
  webLightTheme,
} from "@fluentui/react-components";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import type { SPFxExtensionAppInstance } from "../models/appModel";
import { AppList } from "./components/AppList";
import { FilePicker } from "./components/FilePicker";

import { getConfiguringWebUrl } from "./services/webConfiguratorService";

interface AppProps {
  instance: SPFxExtensionAppInstance;
}
const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();

export function App(props: AppProps) {
  return (
    <FluentProvider theme={webLightTheme}>
        <MessageBar>
          <MessageBarBody>
            <MessageBarTitle>Configuration Context:</MessageBarTitle>
            {queryWeb ? cfgWeb : "Global"}
          </MessageBarBody>
        </MessageBar>
        <FilePicker />
        <AppList />
    </FluentProvider>
  );
}
