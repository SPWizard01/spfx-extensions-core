import { Badge, Link, Title2 } from "@fluentui/react-components";
import type { ComponentChildren } from "preact";
import { useErrorBoundary } from "preact/hooks";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import {
  configurationBelongsToHub,
  configurationIsGlobal,
  configurationIsRootHub,
  configurationWebIsSubsite,
} from "../runtimeStore";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
import { Stack } from "./@common/Stack";
import { ToastNotification } from "./@common/ToastNotification";
import { AppList } from "./AppList/AppList";
import { SelectedAppConfig } from "./SelectedAppConfig/SelectedAppConfig";

const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();

function getBadges() {
  const badges: ComponentChildren[] = [];
  if (configurationIsGlobal) {
    badges.push(
      <Badge key="global" size="extra-large" color="danger">
        Global
      </Badge>
    );
    return badges;
  }
  if (configurationIsRootHub) {
    badges.push(
      <Badge key="root" size="extra-large" color="success">
        Hub root site
      </Badge>
    );
  }
  if (configurationBelongsToHub && !configurationIsRootHub) {
    badges.push(
      <Badge key="child" size="extra-large" color="warning">
        Hub child site
      </Badge>
    );
  }
  if (!configurationIsRootHub && !configurationBelongsToHub) {
    badges.push(
      <Badge key="nonhub" size="extra-large" color="brand">
        Non hub site
      </Badge>
    );
  }
  if (configurationWebIsSubsite) {
    badges.push(
      <Badge key="subsite" size="extra-large" color="informative">
        Sub site
      </Badge>
    );
  } else {
    badges.push(
      <Badge key="root" size="extra-large" color="informative">
        Site collection
      </Badge>
    );
  }
  return badges;
}

export function Index() {
  const [error] = useErrorBoundary();
  if (error) {
    console.error("Error in App component:", error);
    return <div>Error: {error.message}</div>;
  }
  return (
    <Stack
      style={{
        padding: "30px",
      }}
      gap={20}
    >
      <Title2>{queryWeb ? "Web" : "Global"} application list</Title2>
      <Stack horizontal gap={8} verticalAlign="center">
        {...getBadges()}
        <Link target="_blank" href={cfgWeb}>
          {cfgWeb}
        </Link>
      </Stack>
      <AppList />
      <SelectedAppConfig />
      <ToastNotification />
    </Stack>
  );
}
