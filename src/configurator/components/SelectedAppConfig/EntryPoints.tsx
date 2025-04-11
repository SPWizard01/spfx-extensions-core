import { Button, Subtitle2 } from "@fluentui/react-components";
import { Edit16Regular, Javascript20Regular } from "@fluentui/react-icons";
import { signal, useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import { configurationWebSP, selectedAppItem } from "../../runtimeStore";
import { getAllAppJSFiles } from "../../services/fileService";
import { Stack } from "../@common/Stack";
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

  async function getJsFiles() {
    if (!selectedAppItem.value) return;
    const allAvailableJS = await getAllAppJSFiles(
      configurationWebSP,
      selectedAppItem.value.name
    );
    setAllJSFiles(allAvailableJS);
  }
  return (
    <>
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "10px" }}
      >
        <Subtitle2>Entry points</Subtitle2>
        <Stack horizontal gap={8}>
          <Button
            onClick={() => {
              UploadProjectDrawerSignal.value = "edit";
            }}
            icon={<Edit16Regular />}
          />
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
            <Javascript20Regular /> {ep}
          </Stack>
        ))}
      <UploadProjectDrawer jsFiles={allJSFiles} />
    </>
  );
}
