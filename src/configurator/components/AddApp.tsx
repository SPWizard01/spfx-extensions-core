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
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { configurationWebSP } from "../runtimeStore";
import { addAppCollection } from "../services/appCollection";

interface AddAppProps {}

const useStyles = makeStyles({
  addBtn: {
    gap: "20px",
    marginTop: "20px",
    marginLeft: "32px",
    //padding: "20px",
  },
});

export function AddApp({}: AddAppProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  async function dialogOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    setOpen(data.open);
  }

  async function addApp() {
    if(!inputValue) return;
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
        <Button className={styles.addBtn} appearance="primary">
          Add an app
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
            Add new application.
          </DialogTitle>
          <DialogContent>
            <Input
              value={inputValue}
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
              Add
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
