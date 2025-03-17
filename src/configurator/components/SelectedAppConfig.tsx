import { Button, Title3 } from "@fluentui/react-components";
import {
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../runtimeStore";
import { updateAppManifest } from "../services/appManifest";
import { ManifestConfig } from "./ManifestConfig";
import { Stack } from "./Stack";
import { StackItem } from "./StackItem";

export function SelectedAppConfig() {
  async function saveManifest() {
    const app = selectedAppItem.value!;
    await updateAppManifest(configurationWebSP, app.name, app.manifest);
    updateSelectedApp(app, true);
    selectedAppItem.value = undefined;
  }
  if (!selectedAppItem.value) return null;
  return (
    <Stack gap={15}>
      <StackItem align="center">
        <Title3>Configuration of {selectedAppItem.value.name}</Title3>
      </StackItem>
      <StackItem>
        <ManifestConfig />
      </StackItem>
      <Stack horizontal gap={15}>
        <StackItem>
          <Button
            appearance="secondary"
            onClick={() => {
              selectedAppItem.value = undefined;
            }}
          >
            Close
          </Button>
        </StackItem>
        <StackItem>
          <Button appearance="primary" onClick={saveManifest}>
            Save
          </Button>
        </StackItem>
      </Stack>
    </Stack>
  );
}
