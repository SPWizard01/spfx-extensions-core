import { Divider, Subtitle2 } from "@fluentui/react-components";
import { configurationIsRootHub, selectedAppItem } from "../../runtimeStore";
import { Stack } from "../@common/Stack";
import { StackItem } from "../@common/StackItem";
import { AddWeb } from "./AddWeb";
import { AppDefinitionGrid } from "./AppDefinitionGrid";
import EntryPoints from "./EntryPoints";

export function ManifestConfig() {
  const app = selectedAppItem.value;

  if (!app) return null;
  return (
    <Stack horizontal gap={20} style={{ height: "100%" }}>
      <Stack
        gap={16}
        style={{
          paddingBottom: "20px",
          flexBasis: "240px",
          flexShrink: 0,
        }}
      >
        <EntryPoints />
      </Stack>
      <Stack>
        <Divider vertical style={{ height: "100%" }} />
      </Stack>
      <StackItem>
        <Subtitle2>Web application</Subtitle2>
        <AppDefinitionGrid />
        {configurationIsRootHub ? <AddWeb /> : null}
        {/* <StackItem>
          <AppDefinitionConfiguration />
        </StackItem> */}
        {/* <StackItem>
          <Stack verticalAlign="center" horizontal gap={8}>
            <Label>Is ESM: </Label>
            <Switch
              checked={app.manifest.isESM}
              disabled={!app.manifest.enabled}
              onChange={(_, d) => {
                app.manifest.isESM = d.checked;
                updateSelectedApp(app);
              }}
            />
          </Stack>
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
      </StackItem>
      {/* <StackItem>
        <Label>Entry Points: </Label>
        <Dropdown
          multiselect={true}
          placeholder="Select entrypoints to load"
          disabled={!app.manifest.enabled}
          onOptionSelect={onOptionSelect}
          defaultSelectedOptions={app.manifest.appRelativeEntryPointUrls}
          defaultValue={app.manifest.appRelativeEntryPointUrls.join(", ")}
        >
          {allJSFiles.map((ep) => (
            <Option key={ep} value={ep}>
              {ep}
            </Option>
          ))}
        </Dropdown>
      </StackItem> */}
    </Stack>
  );
}
