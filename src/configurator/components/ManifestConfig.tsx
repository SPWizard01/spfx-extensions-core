import {
  Dropdown,
  Input,
  Label,
  makeStyles,
  Option,
  Switch,
  type OptionOnSelectData,
  type SelectionEvents,
} from "@fluentui/react-components";
import {
  effect,
  signal,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals-react";
import { useState } from "react";
import { isFileAllowedToRun } from "../../core/services/allowedAppsService";
import {
  GetCacheStringForAsset,
  GetCacheStringHashForAssetAsync,
} from "../../core/services/browserCache";
import { importEntryPoint } from "../../core/services/componentLoaderService";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import {
  configurationWebIsRootHub,
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../runtimeStore";
import { getAllAppJSFiles } from "../services/fileService";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
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
const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();

interface ManifestConfigProps {}
export function ManifestConfig({}: ManifestConfigProps) {
  const app = selectedAppItem.value;
  const [allJSFiles, setAllJSFiles] = useState<string[]>([]);
  const selectedAppHash = useSignal("Not calculated");
  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    if (selectedAppItem.value.manifest.enableCaching) {
      GetCacheStringHashForAssetAsync(
        selectedAppItem.value.manifest.cacheStart ?? new Date().getTime(),
        selectedAppItem.value.manifest.cacheDuration ?? 60
      ).then((hash) => (selectedAppHash.value = hash));
    }
    getJsFiles();
  });
  const customStyles = useCustomStyles();
  async function onOptionSelect(
    event: SelectionEvents,
    data: OptionOnSelectData
  ) {
    for (const element of data.selectedOptions) {
      const fullUrl = new URL(
        `${cfgWeb}/${SPFX_EXTENSIONS_FOLDER}/${app!.name}/${element}`
      );
      console.log(`Check: ${fullUrl}`);
      isFileAllowedToRun(fullUrl, true);
      //if file is allowed to run then import it and set appdefinitions exported by that file to state so we can configure them.
      //importEntryPoint(`${fullUrl}`,true);
    }
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
        <AppDefinitionConfiguration app={app} />
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
          placeholder="Cache duration"
          type="number"
          value={`${app.manifest.cacheDuration ?? 60}`}
          onChange={(ev, data) => {
            app.manifest.cacheStart = new Date().getTime();
            app.manifest.cacheDuration = Number(data.value) ?? 60;
            updateSelectedApp(app);
          }}
        />
        {app.manifest.enableCaching ? (
          <Label size="small">Cache string: {selectedAppHash.value}</Label>
        ) : null}
      </div>
      <FilePicker />
    </div>
  );
}
