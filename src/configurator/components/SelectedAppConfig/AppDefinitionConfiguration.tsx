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
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import {
  selectedAppItem,
  selectedWebAvailableWebs,
  updateSelectedApp,
} from "../../runtimeStore";
import { getAppDefinitions } from "../../services/appDefinitionImport";
import { Stack } from "../@common/Stack";
import { AddWeb } from "./AddWeb";

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
  isSubWeb: boolean;
}

interface WebIdAppIdMap extends WebIdName {
  enabledApps: string[];
}

export function AppDefinitionConfiguration(
  _props: AppDefinitionConfigurationProps
) {
  const app = selectedAppItem.value;
  const allWebs: WebIdAppIdMap = {
    Id: "*",
    Name: "All",
    Url: "*",
    enabledApps: [],
    isSubWeb: true,
  };
  const [Alldefs, setAllDefs] = useState<AppIdName[]>([]);
  const [webIdMap, setWebIdMap] = useState<WebIdAppIdMap[]>([]);
  const [selectedWeb, setSelectedWeb] = useState<WebIdAppIdMap>(allWebs);
  function getSelectedAppValue() {
    const selectedWebIdApps =
      app?.manifest.appDefinitionMap.find((a) => a.webId === selectedWeb.Id)
        ?.enabledAppIds ?? [];

    const values = selectedWebIdApps.map((a) => {
      return Alldefs.find((d) => d.id === a)?.name ?? a;
    });
    return values.join(", ");
  }

  function getSelectedWebValue() {
    if (!selectedWeb) return "All (*)";
    return `${selectedWeb.Name} (${selectedWeb.Url})`;
  }

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    const allWebIds: WebIdAppIdMap[] = [allWebs];

    allWebIds.push(
      ...selectedWebAvailableWebs.map((w) => ({
        Id: w.Id,
        Name: w.Title,
        Url: w.ServerRelativeUrl,
        isSubWeb: true,
        enabledApps: [],
      }))
    );
    downloadDataApp.manifest.appDefinitionMap.forEach((w) => {
      const web = allWebIds.find((w1) => w1.Id === w.webId);
      if (web) {
        web.enabledApps = w.enabledAppIds;
      } else {
        allWebIds.push({
          Id: w.webId,
          Name: "Unknown",
          Url: `Unknown_${w.webId}`,
          isSubWeb: false,
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
  if (!app) return null;
  return (
    <Stack>
      <Stack horizontal verticalAlign="center" gap={8}>
        <Label>Enabled On Webs: </Label>
        <Dropdown
          multiselect={false}
          disabled={!app.manifest.enabled}
          selectedOptions={[selectedWeb.Id]}
          value={getSelectedWebValue()}
          onOptionSelect={(_ev: SelectionEvents, data: OptionOnSelectData) => {
            setSelectedWeb(
              webIdMap.find((w) => w.Id === (data.optionValue ?? "*")) ??
                allWebs
            );
          }}
        >
          {webIdMap.map((w) => (
            <Option key={w.Id} value={w.Id}>
              {w.Name} ({w.Url})
            </Option>
          ))}
        </Dropdown>
        <AddWeb
          disabled={!app.manifest.enabled}
          onWebResolved={(web) => {
            if (webIdMap.some((w) => w.Id === web.Id)) return;
            const newWebIdMap = [
              ...webIdMap,
              {
                Id: web.Id,
                Name: web.Title,
                Url: web.ServerRelativeUrl,
                isSubWeb: true,
                enabledApps: [],
              },
            ];
            setWebIdMap(newWebIdMap);
          }}
        >
          Add web
        </AddWeb>
        <Button
          appearance="secondary"
          size="medium"
          disabled={!app.manifest.enabled || selectedWeb.isSubWeb}
          onClick={() => {
            const newWebIdMap = webIdMap.filter((w) => w.Id !== selectedWeb.Id);
            setWebIdMap(newWebIdMap);
            setSelectedWeb(allWebs);
          }}
        >
          Remove web
        </Button>
      </Stack>
      <Stack horizontal verticalAlign="center" gap={8}>
        <Label>Enabled Apps: </Label>
        <Dropdown
          multiselect={true}
          placeholder="Select App Definitions"
          disabled={!app.manifest.enabled}
          selectedOptions={
            app.manifest.appDefinitionMap.find((a) => a.webId === selectedWeb.Id)
              ?.enabledAppIds ?? []
          }
          value={getSelectedAppValue()}
          onOptionSelect={(_ev: SelectionEvents, data: OptionOnSelectData) => {
            const arrayEntry = app.manifest.appDefinitionMap.find(
              (a) => a.webId === selectedWeb.Id
            );
            const selected = data.selectedOptions.map((o) => o);
            if (selected.includes("*")) {
              selected.splice(0, selected.length, "*");
            }
            if (arrayEntry) {
              arrayEntry.enabledAppIds = selected;
            } else {
              app.manifest.appDefinitionMap.push({
                webId: selectedWeb.Id,
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
                app.manifest.appDefinitionMap
                  .find((a) => a.webId === selectedWeb.Id)
                  ?.enabledAppIds.includes("*") && d.id !== "*"
              }
            >
              {d.name}
            </Option>
          ))}
        </Dropdown>
        <Button size="medium" disabled={!app.manifest.enabled}>
          Add app
        </Button>
        <Button
          size="medium"
          disabled={!app.manifest.enabled}
          onClick={() => {
            for (const appMap of app.manifest.appDefinitionMap) {
              appMap.enabledAppIds = appMap.enabledAppIds.filter(
                (a) => a !== selectedWeb.Id
              );
            }
          }}
        >
          Remove app
        </Button>
      </Stack>
    </Stack>
  );
}
