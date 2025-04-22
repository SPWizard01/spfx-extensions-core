import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Input,
  ToolbarButton,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { Add16Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { useSignal } from "@preact/signals";
import type { SPFxExtensionAppDefinitionMapItem } from "../../../models/appFolderManifest";
import { EMPTY_APP_DEF_ITEM_CONFIG } from "../../../utilities/constants";
import { cloneObject } from "../../../utilities/helpers";
import { selectedAppItem } from "../../runtimeStore";

export function AddAppConfig() {
  const input = useSignal<string>("");
  const addAppConfigDialogOpen = useSignal(false);
  async function dialogOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    addAppConfigDialogOpen.value = data.open;
  }

  async function addAppDefItem() {
    if (
      !input.value ||
      !selectedAppItem.value ||
      selectedAppItem.value.manifest.appDefinitionMap.some(
        (a) => a.appId === input.value
      )
    )
      return;

    const emptyDefinition: SPFxExtensionAppDefinitionMapItem = {
      appId: input.value,
      config: cloneObject(EMPTY_APP_DEF_ITEM_CONFIG),
    };

    const copy = cloneObject(selectedAppItem.value);
    copy.manifest.appDefinitionMap.push(emptyDefinition);
    selectedAppItem.value = copy;
    addAppConfigDialogOpen.value = false;
  }

  if (!selectedAppItem.value || selectedAppItem.value.manifest.isESM)
    return null;

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
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<Dismiss24Regular />}
                />
              </DialogTrigger>
            }
          >
            Create new app config
          </DialogTitle>
          <DialogContent style={{ padding: "16px 0" }}>
            <Input
              value={input.value}
              style={{ width: "100%" }}
              placeholder="Enter application id or entrypoint path"
              onChange={(_, d) => {
                input.value = d.value;
              }}
            />
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement action="close">
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              disabled={
                !input.value ||
                selectedAppItem.value?.manifest.appDefinitionMap.some(
                  (a) => a.appId === input.value
                )
              }
              onClick={() => {
                addAppDefItem();
              }}
            >
              Create
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
