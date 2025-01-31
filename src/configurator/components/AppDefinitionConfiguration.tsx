import {
  Dropdown,
  Label,
  Option,
  Table,
  type OptionOnSelectData,
  type SelectionEvents,
} from "@fluentui/react-components";

import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import {
  allAppItems,
  getAppItem,
  selectedWebAvailableWebs,
} from "../runtimeStore";
interface AppDefinitionConfigurationProps {
  app: AppCollectionConfigurationItem;
}

function update(currentApp: AppCollectionConfigurationItem) {
  const apps = JSON.parse(
    JSON.stringify(allAppItems.value)
  ) as AppCollectionConfigurationItem[];
  let foundApp = apps.findIndex((w) => w.name === currentApp.name);
  if (foundApp > -1) {
    apps.splice(foundApp, 1, currentApp);
  } else {
    apps.push(currentApp);
  }
  allAppItems.value = apps;
}

export function AppDefinitionConfiguration({
  app,
}: AppDefinitionConfigurationProps) {
  //https://www.npmjs.com/package/@preact/signals-react#hooks

  return (
    <>
      <Label>Enabled On Webs: </Label>
      <Dropdown
        multiselect={true}
        value={`${
          app.manifest.enabledApps.some((w) => w.webId === "*")
            ? "All"
            : `${app.manifest.enabledApps.length} selected`
        }`}
        onOptionSelect={(ev: SelectionEvents, data: OptionOnSelectData) => {
          const newApp: AppCollectionConfigurationItem = {
            ...app,
            manifest: {
              ...app.manifest,
              enabledApps: data.selectedOptions.map((w) => ({
                webId: w,
                enabledAppIds: [],
              })),
            },
          };
          update(newApp);
        }}
      >
        <Option key={"All"} value="*">
          All
        </Option>
        {selectedWebAvailableWebs.map((w) => (
          <Option key={w.Id} value={w.Id}>
            {w.Title}
          </Option>
        ))}
      </Dropdown>
    </>
  );
}
