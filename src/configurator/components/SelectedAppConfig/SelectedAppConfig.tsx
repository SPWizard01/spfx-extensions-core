import { Button, Subtitle1 } from "@fluentui/react-components";
import { ArrowLeft16Regular, Folder24Regular } from "@fluentui/react-icons";
import {
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../../runtimeStore";
import { updateAppManifest } from "../../services/appManifest";
import { Stack } from "../@common/Stack";
import { StackItem } from "../@common/StackItem";
import { ManifestConfig } from "./ManifestConfig";

export function SelectedAppConfig() {
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
      style={{
        height: "100%",
      }}
    >
      <Stack horizontalAlign="space-between" horizontal verticalAlign="center">
        <Stack gap={10} horizontal verticalAlign="center">
          <Folder24Regular />
          <Subtitle1>Configuration of {selectedAppItem.value.name}</Subtitle1>
        </Stack>
        <Stack horizontal gap={15}>
          <StackItem>
            <Button
              appearance="secondary"
              icon={<ArrowLeft16Regular />}
              onClick={() => {
                selectedAppItem.value = undefined;
              }}
            >
              Back
            </Button>
          </StackItem>
          <StackItem>
            <Button appearance="primary" onClick={saveManifest}>
              Save
            </Button>
          </StackItem>
        </Stack>
      </Stack>
      <ManifestConfig />
    </Stack>
  );
}
