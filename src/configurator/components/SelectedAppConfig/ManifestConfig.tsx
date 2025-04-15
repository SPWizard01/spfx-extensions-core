import {
  Button,
  Input,
  Subtitle2,
  Switch,
} from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { GetRandomCacheStringAsync } from "../../../core/services/browserCache";
import { selectedAppItem, updateSelectedApp } from "../../runtimeStore";
import { Stack } from "../common/Stack";
import { AppDefinitionGrid } from "./AppDefinitionGrid";
import EntryPoints from "./EntryPoints";

export function ManifestConfig() {
  const app = selectedAppItem.value;

  if (!app) return null;
  return (
    <Stack horizontal gap={20}>
      <Stack
        gap={16}
        style={{
          paddingBottom: "20px",
          flexBasis: "240px",
          flexShrink: 0,
          paddingRight: "20px",
          borderRight: "1px solid #eaeaea",
        }}
      >
        <EntryPoints />
      </Stack>
      <Stack style={{ flexGrow: 1 }}>
        <Stack
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
          style={{ minHeight: "32px" }}
        >
          <Stack horizontal gap={16} verticalAlign="center">
            <Subtitle2>Applications</Subtitle2>
            {!app.manifest.isESM && (
              <Stack horizontal gap={8}>
                <Button onClick={() => {}} icon={<Add16Regular />}>
                  Add app
                </Button>
              </Stack>
            )}
          </Stack>
          <Stack gap={8} horizontal>
            <Switch
              checked={app.manifest.enableCaching}
              label="Enable caching"
              onChange={(_, d) => {
                app.manifest.enableCaching = d.checked;
                updateSelectedApp(app);
              }}
            />

            <Input
              placeholder="Cache string"
              disabled={!app.manifest.enableCaching}
              type="text"
              value={app.manifest.cacheString ?? ""}
              onChange={(_ev, data) => {
                app.manifest.cacheString = data.value;
                updateSelectedApp(app);
              }}
            />
            <Button
              size="medium"
              disabled={!app.manifest.enableCaching}
              onClick={async () => {
                app.manifest.cacheString = await GetRandomCacheStringAsync();
                updateSelectedApp(app);
              }}
            >
              Generate
            </Button>
          </Stack>
        </Stack>
        <AppDefinitionGrid />
        {/* <StackItem>
          <AppDefinitionConfiguration />
        </StackItem> */}
        {/* {!app.manifest.isESM && app.manifest.enabled ? (
          <StackItem shrink>
            <MessageBar intent="warning">
              <MessageBarBody>
                <Text>
                  You have to manually fill the "Enabled Apps" list as this is
                  not an ESM module app
                </Text>
              </MessageBarBody>
            </MessageBar>
          </StackItem>
        ) : null} */}
        {/* <Stack verticalAlign="center" horizontal gap={8}>
          <InfoLabel info="Only available on hub roots">
            Enabled on all Hub sites:{" "}
          </InfoLabel>
          <Switch
            checked={app.manifest.enabledOnAllHubSites}
            disabled={!configurationWebIsRootHub || !app.manifest.enabled}
            onChange={(_, d) => {
              app.manifest.enabledOnAllHubSites = d.checked;
              updateSelectedApp(app);
            }}
          />
        </Stack> */}
        {/* <Stack verticalAlign="center" horizontal gap={8}>
          <Label>Enabled: </Label>
          <Switch
            checked={app.manifest.enabled}
            onChange={(_, d) => {
              app.manifest.enabled = d.checked;
              updateSelectedApp(app);
            }}
          />
        </Stack> */}
        {/* <Stack horizontal verticalAlign="center" gap={8}>
          <Label>Use Caching: </Label>
          <Switch
            checked={app.manifest.enableCaching}
            disabled={!app.manifest.enabled}
            onChange={(_, d) => {
              app.manifest.enableCaching = d.checked;
              updateSelectedApp(app);
            }}
          />
          {app.manifest.enableCaching ? (
            <>
              <Input
                placeholder="Cache string"
                disabled={!app.manifest.enableCaching || !app.manifest.enabled}
                type="text"
                value={app.manifest.cacheString ?? ""}
                onChange={(_ev, data) => {
                  app.manifest.cacheString = data.value;
                  updateSelectedApp(app);
                }}
              />
              <Button
                size="medium"
                disabled={!app.manifest.enableCaching || !app.manifest.enabled}
                onClick={async () => {
                  app.manifest.cacheString = await GetRandomCacheStringAsync();
                  updateSelectedApp(app);
                }}
              >
                Generate
              </Button>
            </>
          ) : null}
        </Stack> */}
        {/* {app.manifest.enableCaching ? (
          <Label size="small">Cache string: {app.manifest.cacheString}</Label>
        ) : null} */}
      </Stack>
    </Stack>
  );
}
