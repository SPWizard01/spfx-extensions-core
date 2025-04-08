import { Divider, Subtitle2, Switch } from "@fluentui/react-components";
import { useSignalEffect } from "@preact/signals";
import { useState } from "react";
import {
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../../runtimeStore";
import { getAllAppJSFiles } from "../../services/fileService";
import { Stack } from "../@common/Stack";
import { StackItem } from "../@common/StackItem";
import { AppDefinitionGrid } from "./AppDefinitionGrid";
import { FilePicker } from "./FilePicker";

export function ManifestConfig() {
  const app = selectedAppItem.value;
  const [allJSFiles, setAllJSFiles] = useState<string[]>([]);
  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    getJsFiles();
  });

  async function onEPToggleSelect(checked: boolean, checkedEpName: string) {
    if (checked) {
      app!.manifest.appRelativeEntryPointUrls.push(checkedEpName);
    }

    if (!checked) {
      app!.manifest.appRelativeEntryPointUrls =
        app!.manifest.appRelativeEntryPointUrls.filter(
          (epUrl) => epUrl !== checkedEpName
        );
    }
    updateSelectedApp(app!);
  }
  // async function onOptionSelect(
  //   _event: SelectionEvents,
  //   data: OptionOnSelectData
  // ) {
  //   app!.manifest.appRelativeEntryPointUrls = data.selectedOptions;
  //   updateSelectedApp(app!);
  //   // for (const element of data.selectedOptions) {
  //   //   console.log(`Selected: ${element}`);

  //   //   const fullUrl = new URL(
  //   //     `${cfgWeb}/${SPFX_EXTENSIONS_FOLDER}/${app!.name}/${element}`
  //   //   );
  //   //   console.log(`Check: ${fullUrl}`);
  //   //   isFileAllowedToRun(fullUrl, true);
  //   //   //if file is allowed to run then import it and set appdefinitions exported by that file to state so we can configure them.
  //   //   //importEntryPoint(`${fullUrl}`,true);
  //   // }
  // }

  // async function onCheckBoxSelected(option: CheckboxOnChangeData) {
  //   app!.manifest.appRelativeEntryPointUrls = setselectedEP;
  //   updateSelectedApp(app!);
  // }

  async function getJsFiles() {
    if (!selectedAppItem.value) return;
    const allAvailableJS = await getAllAppJSFiles(
      configurationWebSP,
      selectedAppItem.value.name
    );
    setAllJSFiles(allAvailableJS);
  }
  if (!app) return null;
  return (
    <Stack horizontal gap={20} style={{ height: "100%" }}>
      <Stack
        horizontalAlign="space-between"
        style={{
          paddingBottom: "20px",
          flexBasis: "240px",
        }}
      >
        <Stack>
          <Subtitle2>Entry points</Subtitle2>
          {allJSFiles.map((ep) => (
            <Switch
              label={ep}
              labelPosition="before"
              defaultChecked={app!.manifest.appRelativeEntryPointUrls.some(
                (selected) => selected === ep
              )}
              onChange={(_, data) => {
                onEPToggleSelect(data.checked, ep);
              }}
              root={{
                style: {
                  justifyContent: "space-between",
                },
              }}
            />
          ))}
        </Stack>
        <FilePicker />
      </Stack>
      <Stack>
        <Divider vertical style={{ height: "100%" }} />
      </Stack>
      <StackItem>
        <Subtitle2>Web application</Subtitle2>
        <AppDefinitionGrid />
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
