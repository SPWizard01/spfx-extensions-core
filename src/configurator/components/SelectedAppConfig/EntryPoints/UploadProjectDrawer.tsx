import {
  Badge,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Spinner,
  Switch,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  DismissCircle24Regular,
} from "@fluentui/react-icons";
import { selectedAppItem, updateSelectedApp, uploadProjectDrawerOpen } from "../../../runtimeStore";
import { Stack } from "../../common/Stack";

import { FilePicker, filesToUpload } from "./FilePicker";

interface UploadProjectDrawerProps {
  jsFiles: string[];
}

export function UploadProjectDrawer({ jsFiles }: UploadProjectDrawerProps) {
  const app = selectedAppItem.value;
  const restoreFocusSourceAttributes = useRestoreFocusSource();

  async function onEPToggleSelect(checked: boolean, checkedEpName: string) {
    if (!app) return;
    if (checked) {
      app.manifest.appRelativeEntryPointUrls.push(checkedEpName);
    }

    if (!checked) {
      app.manifest.appRelativeEntryPointUrls = app.manifest.appRelativeEntryPointUrls.filter(
        (epUrl) => epUrl !== checkedEpName
      );
    }
    updateSelectedApp(app, true);
  }

  if (!app) return null;

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={uploadProjectDrawerOpen.value}
      onOpenChange={(_: any, { open }: { open: boolean }) => {
        uploadProjectDrawerOpen.value = open;
      }}
      style={{ width: "440px" }}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => (uploadProjectDrawerOpen.value = false)}
            />
          }
        >
          Manage Entry Points
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <Stack gap={16} style={{ padding: "12px 0px" }}>
          <FilePicker />
          <Stack gap={4}>
            {jsFiles.map((ep) => (
              <Switch
                label={ep}
                labelPosition="before"
                defaultChecked={app!.manifest.appRelativeEntryPointUrls.some(
                  (selected) => selected === ep
                )}
                onChange={(_, data) => {
                  onEPToggleSelect(data.checked, ep);
                }}
                root={{
                  style: {
                    justifyContent: "space-between",
                  },
                }}
              />
            ))}
            <Stack gap={20} style={{ marginTop: "10px", padding: "0px 10px 0 8px" }}>
              {filesToUpload.value.map((file) => (
                <Stack key={file.fileName} horizontalAlign="space-between" horizontal>
                  <Stack>{file.fileName}</Stack>

                  {file.status === "uploaded" && (
                    <Badge
                      size="medium"
                      appearance="ghost"
                      color="success"
                      icon={<CheckmarkCircle24Regular />}
                    />
                  )}
                  {file.status === "error" && (
                    <Badge
                      size="medium"
                      appearance="ghost"
                      color="danger"
                      icon={<DismissCircle24Regular />}
                    />
                  )}
                  {file.status === "uploading" && <Spinner size="tiny" />}
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </DrawerBody>
    </Drawer>
  );
}
