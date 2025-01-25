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
  Link,
  makeStyles,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { configurationWebSP } from "../runtimeStore";
import { getAllAppJSFiles } from "../services/fileService";
import { ManifestConfig } from "./ManifestConfig";

interface AddAppProps {
}

const useStyles = makeStyles({
  addBtn: {
    gap: "20px",
    marginTop: "20px",
    marginLeft: "32px",
    //padding: "20px",
  },
});

export function AddApp({ }: AddAppProps) {
  const [entryPoints, setEntryPoints] = useState<string[]>([]);
  const styles = useStyles();
  async function onOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    if (data.open) {
    }
  }

  return (
    <Dialog surfaceMotion={null} modalType="alert" onOpenChange={onOpenChange}>
      <DialogTrigger disableButtonEnhancement>
        <Button className={styles.addBtn} appearance="primary">
          Add an app
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger action="close">
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
            <Input />
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
            <Button appearance="primary">Do Something</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
