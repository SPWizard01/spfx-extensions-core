import { Badge, Link, Title2 } from "@fluentui/react-components";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import {
  configurationWebBelongsToHub,
  configurationWebIsRootHub,
} from "../runtimeStore";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
import { AppList } from "./AppList";
import { SelectedAppConfig } from "./SelectedAppConfig";
import { Stack } from "./Stack";

const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();

export function Index() {
  return (
    <Stack>
      <Title2>{queryWeb ? "Web" : "Global"} application list</Title2>
      {queryWeb && (
        <Stack horizontal gap={8} verticalAlign="center">
          {configurationWebIsRootHub && (
            <Badge size="extra-large" color="success">
              Hub root site
            </Badge>
          )}
          {configurationWebBelongsToHub && (
            <Badge size="extra-large" color="warning">
              Hub child site
            </Badge>
          )}
          {!configurationWebIsRootHub && !configurationWebBelongsToHub && (
            <Badge size="extra-large" color="danger">
              Non hub site
            </Badge>
          )}
          <Link target="_blank" href={cfgWeb}>
            {cfgWeb}
          </Link>
        </Stack>
      )}
      <AppList />
      <SelectedAppConfig />
    </Stack>
  );
}
