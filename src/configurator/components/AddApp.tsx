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
  makeStyles,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { Add24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { configurationWebSP } from "../runtimeStore";
import { addAppCollection } from "../services/appCollection";

interface AddAppProps {}

export function AddApp({}: AddAppProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  async function dialogOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    setOpen(data.open);
  }

  async function addApp() {
    if (!inputValue) return;
    await addAppCollection(configurationWebSP, inputValue);
  }

  return (
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
  );
}
