import {
  Button,
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
import { StrictMode } from "react";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import type { SPFxExtensionAppInstance } from "../models/appModel";
import { getSPFxExtensionApps } from "./services/folderService";
import { getPnPSP } from "./services/pnpService";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";

interface AppProps {
  instance: SPFxExtensionAppInstance;
}
const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();
const sp = getPnPSP(cfgWeb);
const allApps = await getSPFxExtensionApps(sp);

export function App(props: AppProps) {
  return (
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <Label>You are configuring apps for {cfgWeb}</Label>
        <MessageBar>
          <MessageBarBody>
            <MessageBarTitle>Configuration Context:</MessageBarTitle>
            {queryWeb ? cfgWeb : "Global"}
          </MessageBarBody>
        </MessageBar>
        <Skeleton>
          <SkeletonItem />
        </Skeleton>
        <div>
          {allApps.map((app) => (
            <>
              <Switch></Switch>
              <Label>{app}</Label>
            </>
          ))}
        </div>
      </FluentProvider>
    </StrictMode>
  );
}
