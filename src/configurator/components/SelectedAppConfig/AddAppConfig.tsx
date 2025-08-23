import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  ToolbarButton,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
  type OptionOnSelectData,
  type SelectionEvents,
} from "@fluentui/react-components";
import { Add16Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { useSignal, useSignalEffect } from "@preact/signals";
import { EMPTY_APP_DEF_ITEM_CONFIG } from "../../../utilities/constants";
import { cloneObject } from "../../../utilities/helpers";
import {
  selectedAppItem,
  selectedAppJSFiles,
  selectedAppManualDefinitionItem,
} from "../../runtimeStore";
import { EMPTY_MANUAL_DEFINITION_ITEM } from "../../utils/constants";
import { Stack } from "../common/Stack";

export function AddAppConfig() {
  const manualApp = useSignal(cloneObject(EMPTY_MANUAL_DEFINITION_ITEM));
  const isEditing = useSignal(false);
  const addAppConfigDialogOpen = useSignal(false);
  useSignalEffect(() => {
    if (selectedAppManualDefinitionItem.value) {
      manualApp.value = cloneObject(selectedAppManualDefinitionItem.value);
      isEditing.value = true;
      addAppConfigDialogOpen.value = true;
    }
  });

  if (!selectedAppItem.value) return null;
  const app = selectedAppItem.value;

  async function dialogOpenChange(_event: DialogOpenChangeEvent, data: DialogOpenChangeData) {
    addAppConfigDialogOpen.value = data.open;
    if (!data.open) {
      selectedAppManualDefinitionItem.value = undefined;
    }
  }
  async function addAppDefItem() {
    if (!manualApp.value.appId || !manualApp.value.name || !manualApp.value.entryPoint) return;
    const copy = cloneObject(app);
    copy.manifest.manualEntries = copy.manifest.manualEntries.filter(
      (a) => a.appId !== manualApp.value.appId
    );
    copy.manifest.manualEntries.push(cloneObject(manualApp.value));
    selectedAppItem.value = copy;
    addAppConfigDialogOpen.value = false;
  }

  const unselectedJSFiles = selectedAppJSFiles.value.filter((file) => {
    return !app.manifest.appRelativeEntryPointUrls.includes(file);
  });
  return (
    <Dialog
      open={addAppConfigDialogOpen.value}
      surfaceMotion={null}
      modalType="alert"
      onOpenChange={dialogOpenChange}
    >
      <DialogTrigger disableButtonEnhancement>
        <ToolbarButton appearance={"outline"} icon={<Add16Regular />}>
          Add Entry
        </ToolbarButton>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger disableButtonEnhancement action="close">
                <Button appearance="subtle" aria-label="close" icon={<Dismiss24Regular />} />
              </DialogTrigger>
            }
          >
            Create new app config
          </DialogTitle>
          <DialogContent style={{ padding: "16px 0" }}>
            <Stack gap={16}>
              <Stack gap={8} horizontal>
                <Input
                  disabled={isEditing.value}
                  value={manualApp.value.appId}
                  style={{ width: "100%" }}
                  placeholder="Enter application id (guid) or click Generate"
                  onChange={(_, d) => {
                    manualApp.value = {
                      ...manualApp.value,
                      appId: d.value,
                    };
                  }}
                />
                <Button
                  disabled={isEditing.value}
                  onClick={() => {
                    manualApp.value = {
                      ...manualApp.value,
                      appId: window.crypto.randomUUID(),
                    };
                  }}
                >
                  Generate
                </Button>
              </Stack>

              <Input
                defaultValue={manualApp.value.name}
                style={{ width: "100%" }}
                placeholder="Enter application name to be shown below"
                onChange={(_, d) => {
                  manualApp.value = {
                    ...manualApp.value,
                    name: d.value,
                  };
                }}
              />
              <Dropdown
                placeholder="Select entry point"
                defaultValue={manualApp.value.entryPoint}
                onOptionSelect={(_ev: SelectionEvents, data: OptionOnSelectData) => {
                  manualApp.value = {
                    ...manualApp.value,
                    entryPoint: data.optionValue ?? "",
                  };
                }}
              >
                {unselectedJSFiles.map((file) => (
                  <Option key={file} value={file}>
                    {file}
                  </Option>
                ))}
              </Dropdown>
              <MessageBar>
                <MessageBarBody>
                  <MessageBarTitle>Remember:</MessageBarTitle>
                  While adding your app manually, you have to ensure that the code inside entry
                  point calls window.__SPFxExtensions.RegisterApp and/or
                  window.__SPFxExtensions.InstantiateApp methods. This ensures proper lifecycle
                  management of your SPFx application. If you want just a side-effect, you do not
                  need to call those methods.
                </MessageBarBody>
              </MessageBar>
            </Stack>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement action="close">
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              disabled={
                !manualApp.value.appId || !manualApp.value.name || !manualApp.value.entryPoint
              }
              onClick={() => {
                addAppDefItem();
              }}
            >
              {isEditing.value ? "Save" : "Add"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
