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
  Spinner,
  Toast,
  ToastTitle,
  useToastController,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { Add24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import { configurationWebSP } from "../../runtimeStore";
import { addAppCollection } from "../../services/appCollection";
import { toasterId } from "../@common/ToastNotification";

export function AddApp() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  async function dialogOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    setOpen(data.open);
  }

  const { dispatchToast, updateToast } = useToastController(toasterId);

  const notify = (intent: "progress") => {
    switch (intent) {
      case "progress":
        dispatchToast(
          <Toast>
            <ToastTitle media={<Spinner size="tiny" />}>Creating...</ToastTitle>
          </Toast>,
          {
            toastId: toasterId,
            timeout: -1,
          }
        );
        break;
    }
  };

  async function addApp() {
    if (!inputValue) return;
    notify("progress");
    const addedApp = await addAppCollection(configurationWebSP, inputValue);

    if (addedApp && (addedApp as AppCollectionConfigurationItem).name) {
      updateToast({
        content: (
          <Toast>
            <ToastTitle>Application created.</ToastTitle>
          </Toast>
        ),
        intent: "success",
        toastId: toasterId,
        timeout: 2000,
      });
      setOpen(false);
      return;
    }
    updateToast({
      content: (
        <Toast>
          <ToastTitle>Error occured. Please check console.</ToastTitle>
        </Toast>
      ),
      intent: "error",
      toastId: toasterId,
      timeout: 2000,
    });
  }

  return (
    <>
      <Dialog
        open={open}
        surfaceMotion={null}
        modalType="alert"
        onOpenChange={dialogOpenChange}
      >
        <DialogTrigger action="open">
          <Button appearance="primary" icon={<Add24Regular />}>
            Create application
          </Button>
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
              Create new application
            </DialogTitle>
            <DialogContent style={{ padding: "16px 0" }}>
              <Input
                value={inputValue}
                style={{ width: "100%" }}
                placeholder="Enter application name"
                onChange={(_, d) => {
                  setInputValue(d.value);
                }}
              />
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement action="close">
                <Button appearance="secondary">Close</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={() => {
                  addApp();
                }}
              >
                Create
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
