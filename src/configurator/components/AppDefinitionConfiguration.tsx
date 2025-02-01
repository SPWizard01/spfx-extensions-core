import {
  Dropdown,
  Label,
  Option,
  OptionGroup,
  Table,
  type OptionOnSelectData,
  type SelectionEvents,
} from "@fluentui/react-components";

import { useEffect, useState } from "react";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import {
  allAppItems,
  getAppItem,
  selectedWebAvailableWebs,
  updateApp,
} from "../runtimeStore";
import { getAppDefinitions } from "../services/appDefinitionImport";
interface AppDefinitionConfigurationProps {
  app: AppCollectionConfigurationItem;
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

export function AppDefinitionConfiguration({
  app,
}: AppDefinitionConfigurationProps) {
  const [Alldefs, setAllDefs] = useState<AppIdName[]>([]);
  const [webIdMap, setWebIdMap] = useState<WebIdAppIdMap[]>([]);
  const [selectedWeb, setSelectedWeb] = useState<string>("");
  async function downloadData() {
    const a = await getAppDefinitions(app);
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
    app.manifest.enabledApps.forEach((w) => {
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
    setAllDefs(a);
  }
  useEffect(() => {
    downloadData();
  }, []);
  return (
    <>
      <Label>Enabled On Webs: </Label>
      <Dropdown
        multiselect={false}
        onOptionSelect={(ev: SelectionEvents, data: OptionOnSelectData) => {
          setSelectedWeb(data.optionValue ?? "");
        }}
      >
        {webIdMap.map((w) => (
          <Option key={w.Id} value={w.Id}>
            {w.Name} ({w.Url})
          </Option>
        ))}
      </Dropdown>
      <Dropdown
        multiselect={true}
        placeholder="Select App Definitions"
        selectedOptions={
          app.manifest.enabledApps.find((a) => a.webId === selectedWeb)
            ?.enabledAppIds ?? []
        }
        onOptionSelect={(ev: SelectionEvents, data: OptionOnSelectData) => {
          const arrayEntry = app.manifest.enabledApps.find((a) => a.webId === selectedWeb);
          if (arrayEntry) {
            arrayEntry.enabledAppIds = data.selectedOptions.map((o) => o);
          } else {
            app.manifest.enabledApps.push({
              webId: selectedWeb,
              enabledAppIds: data.selectedOptions.map((o) => o),
            });
          }
          updateApp(app);
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
    </>
  );
}
