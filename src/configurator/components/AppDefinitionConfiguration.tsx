import {
  Button,
  Dropdown,
  Label,
  Option,
  type OptionOnSelectData,
  type SelectionEvents,
} from "@fluentui/react-components";

import { useSignalEffect } from "@preact/signals";
import { useState } from "react";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import {
  selectedAppItem,
  selectedWebAvailableWebs,
  updateSelectedApp,
} from "../runtimeStore";
import { getAppDefinitions } from "../services/appDefinitionImport";
import { useRowStack } from "../styles/stack";
import { Stack } from "./Stack";
interface AppDefinitionConfigurationProps {
  app?: AppCollectionConfigurationItem;
}

interface AppIdName {
  id: string;
  name: string;
}

interface WebIdName {
  Id: string;
  Name: string;
  Url: string;
}

interface WebIdAppIdMap extends WebIdName {
  enabledApps: string[];
}

export function AppDefinitionConfiguration(
  _props: AppDefinitionConfigurationProps
) {
  const app = selectedAppItem.value;
  const [Alldefs, setAllDefs] = useState<AppIdName[]>([]);
  const [webIdMap, setWebIdMap] = useState<WebIdAppIdMap[]>([]);
  const [selectedWeb, setSelectedWeb] = useState<string>("");

  function getSelectedAppValue() {
    const selectedWebIdApps =
      app?.manifest.enabledApps.find((a) => a.webId === selectedWeb)
        ?.enabledAppIds ?? [];

    const values = selectedWebIdApps.map((a) => {
      return Alldefs.find((d) => d.id === a)?.name ?? a;
    });
    return values.join(", ");
  }

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    const allWebIds: WebIdAppIdMap[] = [
      { Id: "*", Name: "All", Url: "*", enabledApps: [] },
    ];

    allWebIds.push(
      ...selectedWebAvailableWebs.map((w) => ({
        Id: w.Id,
        Name: w.Title,
        Url: w.ServerRelativeUrl,
        enabledApps: [],
      }))
    );
    downloadDataApp.manifest.enabledApps.forEach((w) => {
      const web = allWebIds.find((w1) => w1.Id === w.webId);
      if (web) {
        web.enabledApps = w.enabledAppIds;
      } else {
        allWebIds.push({
          Id: w.webId,
          Name: "Unknown",
          Url: `Unknown_${w.webId}`,
          enabledApps: w.enabledAppIds,
        });
      }
    });
    setWebIdMap(allWebIds);
    setAllDefs(allAppDefinitions);
  }
  useSignalEffect(() => {
    if (!app) return;
    downloadData(app);
  });
  const stackStyles = useRowStack();
  if (!app) return null;
  return (
    <Stack>
      <div className={stackStyles.stack}>
        <Label>Enabled On Webs: </Label>
        <Dropdown
          multiselect={false}
          onOptionSelect={(_ev: SelectionEvents, data: OptionOnSelectData) => {
            setSelectedWeb(data.optionValue ?? "");
          }}
        >
          {webIdMap.map((w) => (
            <Option key={w.Id} value={w.Id}>
              {w.Name} ({w.Url})
            </Option>
          ))}
        </Dropdown>
        <Button size="small">Add web</Button>
        <Button size="small">Remove web</Button>
      </div>
      <div className={stackStyles.stack}>
        <Label>Enabled Apps: </Label>
        <Dropdown
          multiselect={true}
          placeholder="Select App Definitions"
          selectedOptions={
            app.manifest.enabledApps.find((a) => a.webId === selectedWeb)
              ?.enabledAppIds ?? []
          }
          value={getSelectedAppValue()}
          onOptionSelect={(_ev: SelectionEvents, data: OptionOnSelectData) => {
            const arrayEntry = app.manifest.enabledApps.find(
              (a) => a.webId === selectedWeb
            );
            const selected = data.selectedOptions.map((o) => o);
            if (selected.includes("*")) {
              selected.splice(0, selected.length, "*");
            }
            if (arrayEntry) {
              arrayEntry.enabledAppIds = selected;
            } else {
              app.manifest.enabledApps.push({
                webId: selectedWeb,
                enabledAppIds: selected,
              });
            }
            updateSelectedApp(app);
          }}
        >
          {Alldefs.map((d) => (
            <Option
              key={d.id}
              value={d.id}
              disabled={
                app.manifest.enabledApps
                  .find((a) => a.webId === selectedWeb)
                  ?.enabledAppIds.includes("*") && d.id !== "*"
              }
            >
              {d.name}
            </Option>
          ))}
        </Dropdown>
        <Button size="small">Add app</Button>
        <Button size="small">Remove app</Button>
      </div>
    </Stack>
  );
}
