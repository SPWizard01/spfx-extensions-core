import { Dropdown, Option, Table } from "@fluentui/react-components";
import {
  batch,
  computed,
  signal,
  useComputed,
  useSignalEffect,
} from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import type { SelectedAppWebs } from "../models/appCollection";
import { selectedAppWebs, selectedWebAvailableWebs } from "../runtimeStore";
interface AppDefinitionConfigurationProps {
  appName: string;
}

function update(currentApp: SelectedAppWebs) {
  console.log(currentApp);
  const apps = selectedAppWebs.value;
  let foundApp = apps.findIndex((w) => w.appName === currentApp.appName);
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
  const currentApp = useSignal<SelectedAppWebs>(
    selectedAppWebs.value.find((w) => w.appName === appName) ?? {
      appName,
      webs: [],
    }
  );

  return (
    <Dropdown
      multiselect={true}
      value={`${
        currentApp.value.webs.some((w) => w === "*")
          ? "All"
          : `${currentApp.value.webs.length} selected`
      }`}
      onOptionSelect={(ev, data) => {
        if (!currentApp) return;
        currentApp.value = { ...currentApp.value, webs: data.selectedOptions };
        update(currentApp.value);
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
