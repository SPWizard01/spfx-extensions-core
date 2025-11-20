import {
  Badge,
  Link,
  Title2,
  Toast,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { Copy16Regular } from "@fluentui/react-icons";
import type { ComponentChildren } from "preact";
import { useErrorBoundary } from "preact/hooks";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import { logGenericCoreError } from "../../core/services/loggingService";

import { GetWebConfigContext } from "../../utilities/getConfigWebContext";
import { configurationIsGlobal } from "../runtimeStore";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
import { AppList } from "./AppList/AppList";
import { ManageSitesDrawer } from "./AppList/ManageSitesDrawer";
import { Stack } from "./common/Stack";
import { toasterId, ToastNotification } from "./common/ToastNotification";
import { SelectedAppConfig } from "./SelectedAppConfig/SelectedAppConfig";

const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();
const configWebType = GetWebConfigContext();

function getBadges() {
  const badges: ComponentChildren[] = [];
  if (configurationIsGlobal) {
    badges.push(
      <Badge key="global" size="extra-large" shape="rounded" color="danger">
        Global
      </Badge>
    );
    return badges;
  }
  if (configWebType === "hubRoot") {
    badges.push(
      <Badge key="hubRoot" size="extra-large" shape="rounded" color="success">
        Hub root site
      </Badge>
    );
  }
  if (configWebType === "hubChild") {
    badges.push(
      <Badge key="child" size="extra-large" shape="rounded" color="warning">
        Hub child site
      </Badge>
    );
  }
  if (configWebType === "nonHub") {
    badges.push(
      <Badge key="nonhub" size="extra-large" shape="rounded" color="brand">
        Non hub site
      </Badge>
    );
  }
  if (configWebType === "subsite") {
    badges.push(
      <Badge key="subsite" size="extra-large" shape="rounded" color="informative">
        Sub site
      </Badge>
    );
  } else {
    badges.push(
      <Badge key="siteCollectionRoot" size="extra-large" shape="rounded" color="informative">
        Site collection
      </Badge>
    );
  }
  return badges;
}

export function Index() {
  const [error] = useErrorBoundary();
  const { dispatchToast } = useToastController(toasterId);
  if (error) {
    logGenericCoreError("Error in App component:", error);
    return <div>Error: {error.message}</div>;
  }

  const notify = () =>
    dispatchToast(
      <Toast>
        <ToastTitle>Link copied to clipboard.</ToastTitle>
      </Toast>,
      { position: "top", intent: "info", timeout: 1000, toastId: cfgWeb }
    );

  return (
    <Stack
      style={{
        padding: "30px",
      }}
      gap={20}
    >
      <Stack horizontal gap={16} verticalAlign="center">
        <Title2>{queryWeb ? "Web" : "Global"} application list</Title2>
        {...getBadges()}
      </Stack>
      {queryWeb && (
        <Stack horizontal gap={8} verticalAlign="center">
          <Link target="_blank" href={cfgWeb}>
            {cfgWeb}
          </Link>
          <Copy16Regular
            onClick={() => {
              navigator.clipboard.writeText(cfgWeb);
              notify();
            }}
          />
        </Stack>
      )}

      <AppList />
      <SelectedAppConfig />
      <ManageSitesDrawer />
      <ToastNotification />
    </Stack>
  );
}
