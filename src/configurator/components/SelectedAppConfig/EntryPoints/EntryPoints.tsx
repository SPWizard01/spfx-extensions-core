import {
  Body1,
  Button,
  Link,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Subtitle2,
  Switch,
  type PositioningImperativeRef,
} from "@fluentui/react-components";
import { Info16Regular, Javascript24Regular } from "@fluentui/react-icons";
import { signal, useSignalEffect } from "@preact/signals";
import { useCallback, useRef, useState } from "preact/hooks";
import {
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../../../runtimeStore";
import { getAllAppJSFiles } from "../../../services/fileService";
import { Stack } from "../../common/Stack";
import { filesToUpload, finishedUploadSignal } from "./FilePicker";
import UploadProjectDrawer from "./UploadProjectDrawer";

export const UploadProjectDrawerSignal = signal<"add" | "edit" | undefined>(
  undefined
);

export default function EntryPoints() {
  const [allJSFiles, setAllJSFiles] = useState<string[]>([]);
  const app = selectedAppItem.value;
  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    getJsFiles();
  });

  useSignalEffect(() => {
    if (finishedUploadSignal.value === true) {
      getJsFiles();
      finishedUploadSignal.value = false;
      filesToUpload.value = [];
    }
  });

  const positioningRef = useRef<PositioningImperativeRef>(null);
  const switchRef = useCallback(
    (el: HTMLButtonElement | null) => {
      positioningRef.current?.setTarget(el);
    },
    [positioningRef]
  );

  async function getJsFiles() {
    if (!selectedAppItem.value) return;
    const allAvailableJS = await getAllAppJSFiles(
      configurationWebSP,
      selectedAppItem.value.name
    );
    setAllJSFiles(allAvailableJS);
  }

  if (!app) return null;
  return (
    <>
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        style={{
          borderBottom: "1px solid #eaeaea",
          paddingBottom: "10px",
        }}
      >
        <Subtitle2>Entry points</Subtitle2>
        <Stack horizontal verticalAlign="center">
          <Switch
            ref={switchRef}
            checked={app.manifest.isESM}
            label={"ESM"}
            labelPosition="before"
            onChange={(_, d) => {
              app.manifest.isESM = d.checked;
              updateSelectedApp(app);
            }}
          />

          <Popover positioning={{ positioningRef }} withArrow>
            <PopoverTrigger disableButtonEnhancement>
              <Link>
                <Info16Regular />
              </Link>
            </PopoverTrigger>
            <PopoverSurface tabIndex={-1}>
              <Body1>Switch on if your entry point(s) export ESM module.</Body1>
            </PopoverSurface>
          </Popover>
        </Stack>
      </Stack>
      {allJSFiles
        .filter((jsFile) =>
          app!.manifest.appRelativeEntryPointUrls.some(
            (selected) => jsFile === selected
          )
        )
        .map((ep) => (
          <Stack horizontal gap={4} verticalAlign="center">
            <Javascript24Regular /> {ep}
          </Stack>
        ))}
      <Button
        onClick={() => {
          UploadProjectDrawerSignal.value = "edit";
        }}
      >
        Upload / Edit
      </Button>
      <UploadProjectDrawer jsFiles={allJSFiles} />
    </>
  );
}
