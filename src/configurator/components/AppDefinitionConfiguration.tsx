import { Dropdown, Option, Table, type OptionOnSelectData, type SelectionEvents } from "@fluentui/react-components";
import {
  batch,
  computed,
  signal,
  useComputed,
  useSignalEffect,
} from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
import { EMPTY_APP_MANIFEST } from "../../utilities/constants";
import type { SelectedAppWebs } from "../models/appCollection";
import { selectedAppWebs, selectedWebAvailableWebs } from "../runtimeStore";
interface AppDefinitionConfigurationProps {
  appName: string;
}

function update(currentApp: SelectedAppWebs) {
  console.log(currentApp);
  const apps = selectedAppWebs.value;
  let foundApp = apps.findIndex(
    (w) => w.appCollectionName === currentApp.appCollectionName
  );
  if (foundApp > -1) {
    apps.splice(foundApp, 1);
  }
  selectedAppWebs.value = [...apps, currentApp];
}

export function AppDefinitionConfiguration({
  appName,
}: AppDefinitionConfigurationProps) {
  //https://www.npmjs.com/package/@preact/signals-react#hooks
  useSignals();
  const currentApp = useComputed<SelectedAppWebs>(() => {
    return (
      selectedAppWebs.value.find((w) => w.appCollectionName === appName) ?? {
        appCollectionName: appName,
        manifest: EMPTY_APP_MANIFEST,
      }
    );
  });

  return (
    <Dropdown
      multiselect={true}
      value={`${
        currentApp.value.manifest.enabledApps.some((w) => w.webId === "*")
          ? "All"
          : `${currentApp.value.manifest.enabledApps.length} selected`
      }`}
      onOptionSelect={(ev: SelectionEvents, data: OptionOnSelectData) => {
        if (!currentApp) return;
        const newApp: SelectedAppWebs = {
          ...currentApp.value,
          manifest: {
            ...currentApp.value.manifest,
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
  );
}
