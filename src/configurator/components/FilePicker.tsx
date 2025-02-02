import { Button } from "@fluentui/react-button";
import { Badge, Spinner } from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  CloudArrowUpRegular,
  DismissCircle24Regular,
} from "@fluentui/react-icons";
import { Body1Strong, Text } from "@fluentui/react-text";
import { useState } from "react";
import Dropzone from "react-dropzone";
import { MANIFEST_NAME } from "../../utilities/constants";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import {
  configurationWebSP,
  selectedAppItem,
  updateSelectedApp,
} from "../runtimeStore";
import {
  addFiles,
  parseUploadFiles,
  type FileContents,
} from "../services/fileService";
import { getZipManifestContents } from "../services/zipService";
import { useRowStack } from "../styles/stack";
import { acceptStyle, baseStyle, focusedStyle, rejectStyle } from "./style";
//use-file-picker
//react-drag-drop-files
interface UploadStatus extends FileContents {
  status: "uploading" | "uploaded" | "error";
}
export function FilePicker() {
  const [filesToUpload, setFilesToUpload] = useState<UploadStatus[]>([]);
  const row = useRowStack();

  async function uploadFiles(files: UploadStatus[]) {
    setFilesToUpload([...files]);
    const uploadFlow = addFiles(
      configurationWebSP,
      selectedAppItem.value!.name,
      files
    );
    let result = await uploadFlow.next();
    while (!result.done) {
      const d = result.value;
      const file = files.find((f) => f.fileName === d.fileName);
      const isManifest = d.fileName.toLowerCase().endsWith(MANIFEST_NAME);
      if (file) {
        file.status = d.success ? "uploaded" : "error";
      }
      if (isManifest && d.success && file) {
        const updateApp = JSON.parse(JSON.stringify(selectedAppItem.value)) as AppCollectionConfigurationItem;
        const content = new TextDecoder().decode(file.content);
        const manifestJson = JSON.parse(content);
        updateApp.manifest = manifestJson;
        updateSelectedApp(updateApp, true);
      }
      setFilesToUpload([...files]);
      result = await uploadFlow.next();
    }
    setTimeout(() => {
      setFilesToUpload([]);
    }, 5000);
  }

  return (
    <div className={row.stack}>
      <div className={row.stackItem}>
        <Dropzone
          useFsAccessApi={false}
          onDropAccepted={(files, event) => {
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
              <input {...getInputProps()} />
              <CloudArrowUpRegular fontSize={28} />
              <Text>
                <Body1Strong>Choose a file(s) </Body1Strong>
                or drag it here
              </Text>
              <Button appearance="primary" onClick={open}>
                Browse
              </Button>
            </div>
          )}
        </Dropzone>
      </div>
      <div className={row.stackItem}>
        {filesToUpload.map((file) => (
          <div className={row.stack} key={file.fileName}>
            <div>{file.fileName}</div>
            {file.status === "uploaded" && (
              <Badge
                size="medium"
                appearance="ghost"
                color="success"
                icon={<CheckmarkCircle24Regular />}
              />
            )}
            {file.status === "error" && (
              <Badge
                size="medium"
                appearance="ghost"
                color="danger"
                icon={<DismissCircle24Regular />}
              />
            )}
            {file.status === "uploading" && <Spinner size="tiny" />}
          </div>
        ))}
      </div>
    </div>
  );
}