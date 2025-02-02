import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Link,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useComputed } from "@preact/signals-react";
import { useState } from "react";
import type { SPFxExtensionAppManifest } from "../../models/appCollectionManifest";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import {
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../runtimeStore";
import { updateAppManifest } from "../services/appManifest";
import { getAllAppJSFiles } from "../services/fileService";
import { ManifestConfig } from "./ManifestConfig";

interface ManifestModalProps {}

export function ManifestModal({}: ManifestModalProps) {
  async function onOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    if (data.open) {
    }
  }

  async function saveManifest() {
    const app = selectedAppItem.value!;
    await updateAppManifest(configurationWebSP, app.name, app.manifest);
    updateSelectedApp(app, true);
    selectedAppItem.value = undefined;
  }
  if (!selectedAppItem.value) return null;
  return (
    <Dialog
      surfaceMotion={null}
      modalType="alert"
      open={selectedAppItem.value !== undefined}
      onOpenChange={onOpenChange}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger action="close">
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<Dismiss24Regular />}
                  onClick={() => {
                    selectedAppItem.value = undefined;
                  }}
                />
              </DialogTrigger>
            }
          >
            Configuration of {selectedAppItem.value.name}
          </DialogTitle>
          <DialogContent>
            <ManifestConfig />
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button
                appearance="secondary"
                onClick={() => {
                  selectedAppItem.value = undefined;
                }}
              >
                Close
              </Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={saveManifest}>
              Save
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
