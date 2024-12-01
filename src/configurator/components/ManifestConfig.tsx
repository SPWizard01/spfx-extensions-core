import {
  Dropdown,
  Label,
  makeStyles,
  Option,
  Switch,
  type OptionOnSelectData,
  type SelectionEvents,
} from "@fluentui/react-components";
import { effect, signal } from "@preact/signals-react";
import { isFileAllowedToRun } from "../../core/services/allowedAppsService";
import { importEntryPoint } from "../../core/services/componentLoaderService";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import { selectedAppWebs } from "../runtimeStore";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
import { getAllWebInfos } from "../services/webInfoService";
import { AppDefinitionConfiguration } from "./AppDefinitionConfiguration";

effect(() => {
  console.log(selectedAppWebs.value)
})

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

interface ManifestConfigProps {
  entryPoints: string[];
  appName: string;
}
export function ManifestConfig({ entryPoints, appName }: ManifestConfigProps) {
  const customStyles = useCustomStyles();
  async function onOptionSelect(
    event: SelectionEvents,
    data: OptionOnSelectData
  ) {
    for (const element of data.selectedOptions) {
      const fullUrl = new URL(
        `${cfgWeb}/${SPFX_EXTENSIONS_FOLDER}/${appName}/${element}`
      );
      console.log(`Check: ${fullUrl}`);
      isFileAllowedToRun(fullUrl, true);
      //if file is allowed to run then import it and set appdefinitions exported by that file to state so we can configure them.
      //importEntryPoint(`${fullUrl}`,true);
    }
  }

  return (
    <div className={customStyles.stackWrapper}>
      <div className={customStyles.stack}>
        <Label>Entry Points: </Label>
        <Dropdown
          multiselect={true}
          placeholder="Select entrypoints to load"
          onOptionSelect={onOptionSelect}
        >
          {entryPoints.map((ep) => (
            <Option key={ep} value={ep}>
              {ep}
            </Option>
          ))}
        </Dropdown>
      </div>
      <AppDefinitionConfiguration appName={appName} />
      <div className={customStyles.stack}>
        <Label>Is ESM: </Label>
        <Switch defaultChecked={false} />
      </div>
      <div className={customStyles.stack}>
        <Label>Enabled on all Hub sites: </Label>
        <Switch defaultChecked={false} />
      </div>
      <div className={customStyles.stack}>
        <Label>Enabled: </Label>
        <Switch defaultChecked={false} />
      </div>
    </div>
  );
}
