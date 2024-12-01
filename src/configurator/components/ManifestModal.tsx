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
import { useState } from "react";
import { configurationWebSP } from "../runtimeStore";
import { getAllAppJSFiles } from "../services/fileService";
import { ManifestConfig } from "./ManifestConfig";

interface ManifestModalProps {
  appName: string;
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

export function ManifestModal({ appName }: ManifestModalProps) {
  const [entryPoints, setEntryPoints] = useState<string[]>([]);
  async function onOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    if (data.open) {
      const allAvailableJS = await getAllAppJSFiles(
        configurationWebSP,
        appName
      );
      setEntryPoints(allAvailableJS);
    }
  }

  return (
    <Dialog surfaceMotion={null} modalType="alert" onOpenChange={onOpenChange}>
      <DialogTrigger disableButtonEnhancement>
        <Link>{appName}</Link>
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
            Configuration of {appName}
          </DialogTitle>
          <DialogContent>
            <ManifestConfig entryPoints={entryPoints} appName={appName} />
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
