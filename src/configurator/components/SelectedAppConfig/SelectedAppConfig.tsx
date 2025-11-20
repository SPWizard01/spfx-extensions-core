import { Button, Subtitle1 } from "@fluentui/react-components";
import { ArrowLeft16Regular } from "@fluentui/react-icons";
import { useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import { configurationWebSP, selectedAppItem, updateSelectedApp } from "../../runtimeStore";
import { updateAppManifest } from "../../services/appManifest";
import { Stack } from "../common/Stack";
import { StackItem } from "../common/StackItem";
import { ManifestConfig } from "./ManifestConfig";

export function SelectedAppConfig() {
  const [prevDefinition, setPrevDefinition] = useState("");
  const [modified, setModified] = useState(false);
  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    const currentCopy = JSON.stringify(selectedAppItem.value);
    if (!prevDefinition) {
      setPrevDefinition(currentCopy);
      return;
    }
    setPrevDefinition(currentCopy);
    setModified(prevDefinition !== currentCopy);
  });

  async function saveManifest() {
    const app = selectedAppItem.value!;
    await updateAppManifest(configurationWebSP, app.name, app.manifest);
    updateSelectedApp(app, true);
    selectedAppItem.value = undefined;
  }
  if (!selectedAppItem.value) return null;
  return (
    <Stack
      gap={20}
    >
      <Stack horizontalAlign="space-between" horizontal verticalAlign="center">
        <Stack gap={10} horizontal verticalAlign="center">
          <Button
            appearance="secondary"
            icon={<ArrowLeft16Regular />}
            onClick={() => {
              selectedAppItem.value = undefined;
            }}
          />
          <Subtitle1>Configuration of {selectedAppItem.value.name}</Subtitle1>
        </Stack>
        <Stack horizontal gap={15}>
          <StackItem>
            <Button appearance="primary" disabled={!modified} onClick={saveManifest}>
              Save
            </Button>
          </StackItem>
        </Stack>
      </Stack>
      <ManifestConfig />
    </Stack>
  );
}
