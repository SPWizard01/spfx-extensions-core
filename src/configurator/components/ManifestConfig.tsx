import {
  Button,
  Dropdown,
  Input,
  Label,
  makeStyles,
  Option,
  Switch,
  type OptionOnSelectData,
  type SelectionEvents,
} from "@fluentui/react-components";
import { useSignalEffect } from "@preact/signals";
import { useState } from "react";
import { GetRandomCacheStringAsync } from "../../core/services/browserCache";
import {
  configurationWebIsRootHub,
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../runtimeStore";
import { getAllAppJSFiles } from "../services/fileService";
import { AppDefinitionConfiguration } from "./AppDefinitionConfiguration";
import { FilePicker } from "./FilePicker";

const useCustomStyles = makeStyles({
  stackWrapper: {
    // display: "flex",
  },
  stack: {
    backgroundColor: "pink",
    flexDirection: "row",
    display: "flex",
    alignItems: "center",
  },
  stackItem: {
    backgroundColor: "lightblue",
    alignContent: "baseline",
  },
});

export function ManifestConfig() {
  const app = selectedAppItem.value;
  const [allJSFiles, setAllJSFiles] = useState<string[]>([]);
  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    getJsFiles();
  });
  const customStyles = useCustomStyles();
  async function onOptionSelect(
    _event: SelectionEvents,
    data: OptionOnSelectData
  ) {
    app!.manifest.appRelativeEntryPointUrls = data.selectedOptions;
    updateSelectedApp(app!);
    // for (const element of data.selectedOptions) {
    //   console.log(`Selected: ${element}`);

    //   const fullUrl = new URL(
    //     `${cfgWeb}/${SPFX_EXTENSIONS_FOLDER}/${app!.name}/${element}`
    //   );
    //   console.log(`Check: ${fullUrl}`);
    //   isFileAllowedToRun(fullUrl, true);
    //   //if file is allowed to run then import it and set appdefinitions exported by that file to state so we can configure them.
    //   //importEntryPoint(`${fullUrl}`,true);
    // }
  }

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
    <div className={customStyles.stackWrapper}>
      <div className={customStyles.stack}>
        <Label>Entry Points: </Label>
        <Dropdown
          multiselect={true}
          placeholder="Select entrypoints to load"
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
      </div>
      <div className={customStyles.stack}>
        <AppDefinitionConfiguration />
      </div>
      <div className={customStyles.stack}>
        <Label>Is ESM: </Label>
        <Switch
          checked={app.manifest.isESM}
          onChange={(_, d) => {
            app.manifest.isESM = d.checked;
            updateSelectedApp(app);
          }}
        />
      </div>
      <div className={customStyles.stack}>
        <Label>Enabled on all Hub sites: </Label>
        <Switch
          checked={app.manifest.enabledOnAllHubSites}
          disabled={!configurationWebIsRootHub}
          onChange={(_, d) => {
            app.manifest.enabledOnAllHubSites = d.checked;
            updateSelectedApp(app);
          }}
        />
      </div>
      <div className={customStyles.stack}>
        <Label>Enabled: </Label>
        <Switch
          checked={app.manifest.enabled}
          onChange={(_, d) => {
            app.manifest.enabled = d.checked;
            updateSelectedApp(app);
          }}
        />
      </div>
      <div className={customStyles.stack}>
        <Label>Use Caching: </Label>
        <Switch
          checked={app.manifest.enableCaching}
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
          size="small"
          disabled={!app.manifest.enableCaching}
          onClick={async () => {
            app.manifest.cacheString = await GetRandomCacheStringAsync();
            updateSelectedApp(app);
          }}
        >
          Generate
        </Button>
        {app.manifest.enableCaching ? (
          <Label size="small">Cache string: {app.manifest.cacheString}</Label>
        ) : null}
      </div>
      <FilePicker />
    </div>
  );
}
