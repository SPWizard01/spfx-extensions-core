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
import { configurationWebSP, getAppItem } from "../runtimeStore";
import { updateAppManifest } from "../services/appManifest";
import { getAllAppJSFiles } from "../services/fileService";
import { ManifestConfig } from "./ManifestConfig";

interface ManifestModalProps {
  app: AppCollectionConfigurationItem;
  //   ref: ForwardedRef<HTMLDivElement>;
}
// export const ManifestModal = forwardRef<HTMLDivElement, ManifestModalProps>(
//   (props, ref) => {
//     return <ManifestModalRef {...props} ref={ref} />;
//   }
// );
// const SlideDialogMotion = createPresenceComponent(() => {
//   const keyframes = [
//     {
//       opacity: 0,
//       transform: "translateX(-100%)",
//       boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0.1)",
//     },
//     { opacity: 1, transform: "translateX(0)", boxShadow: tokens.shadow64 },
//   ];

//   return {
//     enter: {
//       keyframes,
//       easing: motionTokens.curveDecelerateMax,
//       duration: motionTokens.durationGentle,
//     },
//     exit: {
//       keyframes: [...keyframes].reverse(),
//       easing: motionTokens.curveAccelerateMid,
//       duration: motionTokens.durationGentle,
//     },
//   };
// });

// const spwebinfo = await sp.web();

export function ManifestModal({ app }: ManifestModalProps) {
  const [allJSFiles, setAllJSFiles] = useState<string[]>([]);
  async function onOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    if (data.open) {
      const allAvailableJS = await getAllAppJSFiles(
        configurationWebSP,
        app.name
      );
      setAllJSFiles(allAvailableJS);
    }
  }

  async function saveManifest() {
    await updateAppManifest(configurationWebSP, app.name, app.manifest);
  }

  return (
    <Dialog surfaceMotion={null} modalType="alert" onOpenChange={onOpenChange}>
      <DialogTrigger disableButtonEnhancement>
        <Link>{app.name}</Link>
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
            Configuration of {app.name}
          </DialogTitle>
          <DialogContent>
            <ManifestConfig app={app} allJSFiles={allJSFiles} />
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={saveManifest}>Do Something</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
