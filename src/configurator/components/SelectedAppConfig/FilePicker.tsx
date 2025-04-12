import { Button } from "@fluentui/react-button";
import { Field, ProgressBar } from "@fluentui/react-components";
import { Body1Strong, Text } from "@fluentui/react-text";
import { signal } from "@preact/signals";
import { useState } from "react";
import Dropzone from "react-dropzone";
import { MANIFEST_NAME } from "../../../utilities/constants";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import {
    configurationWebSP,
    selectedAppItem,
    updateSelectedApp,
} from "../../runtimeStore";
import {
    type FileContents,
    addFiles,
    parseUploadFiles,
} from "../../services/fileService";
import { getZipManifestContents } from "../../services/zipService";
import { Stack } from "../common/Stack";
import { acceptStyle, baseStyle, focusedStyle, rejectStyle } from "../style";

//use-file-picker
//react-drag-drop-files
interface UploadStatus extends FileContents {
  status: "uploading" | "uploaded" | "error";
}

export const filesToUpload = signal<UploadStatus[]>([]);
export const finishedUploadSignal = signal(false);

export function FilePicker() {
  // const [filesToUpload, setFilesToUpload] = useState<UploadStatus[]>([]);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);
  async function uploadFiles(files: UploadStatus[]) {
    filesToUpload.value = [...files];
    const uploadFlow = addFiles(
      configurationWebSP,
      selectedAppItem.value!.name,
      files
    );
    let result = await uploadFlow.next();
    let uploadedFiles = 1;
    while (!result.done) {
      setUploadedFilesCount(uploadedFiles++);
      const d = result.value;
      const file = files.find((f) => f.fileName === d.fileName);
      const isManifest = d.fileName.toLowerCase().endsWith(MANIFEST_NAME);
      if (file) {
        file.status = d.success ? "uploaded" : "error";
      }
      if (isManifest && d.success && file) {
        const updateApp = JSON.parse(
          JSON.stringify(selectedAppItem.value)
        ) as AppCollectionConfigurationItem;
        const content = new TextDecoder().decode(file.content);
        const manifestJson = JSON.parse(content);
        updateApp.manifest = manifestJson;
        updateSelectedApp(updateApp, true);
      }
      filesToUpload.value = [...files];
      result = await uploadFlow.next();
    }
    setTimeout(() => {
      finishedUploadSignal.value = true;
      setUploadedFilesCount(0);
    }, 3000);
  }

  return (
    <Stack gap={16}>
      <Stack>
        <Dropzone
          useFsAccessApi={false}
          onDropAccepted={(files, _event) => {
            if (files.length === 1 && files[0].name.endsWith(".zip")) {
              getZipManifestContents(files[0]).then((result) => {
                const fl: UploadStatus[] = result.data.map((file) => {
                  return {
                    status: "uploading",
                    ...file,
                  };
                });
                uploadFiles(fl);
              });
              return;
            }
            parseUploadFiles(files).then((result) => {
              const fl: UploadStatus[] = result.data.map((file) => {
                return {
                  status: "uploading",
                  ...file,
                };
              });
              uploadFiles(fl);
            });
          }}
          multiple
          noClick
          noKeyboard
        >
          {({
            getRootProps,
            getInputProps,
            isFocused,
            isDragAccept,
            isDragReject,
            open,
          }) => (
            <div
              {...getRootProps({
                style: {
                  ...baseStyle,
                  ...(isFocused ? focusedStyle : {}),
                  ...(isDragAccept ? acceptStyle : {}),
                  ...(isDragReject ? rejectStyle : {}),
                },
              })}
            >
              {filesToUpload.value.some(
                (file) => file.status === "uploading"
              ) ? (
                <Field
                  validationMessage={`Uploaded ${uploadedFilesCount} of ${filesToUpload.value.length} files `}
                  validationState="none"
                  validation
                  style={{
                    width: "100%",
                  }}
                >
                  <ProgressBar
                    max={filesToUpload.value.length - 1}
                    value={uploadedFilesCount}
                    thickness="large"
                  />
                </Field>
              ) : (
                <>
                  <input {...getInputProps()} />
                  <Text>
                    <Body1Strong>Choose a file(s) </Body1Strong>
                    or drag it here
                  </Text>
                  <Button appearance="primary" onClick={open}>
                    Browse
                  </Button>
                </>
              )}
            </div>
          )}
        </Dropzone>
      </Stack>
    </Stack>
  );
}
