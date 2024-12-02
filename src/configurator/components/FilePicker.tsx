import { Button } from "@fluentui/react-button";
import { CloudArrowUpRegular } from "@fluentui/react-icons";
import { Body1Strong, Text } from "@fluentui/react-text";
import Dropzone, { useDropzone } from "react-dropzone";
import { configurationWebSP } from "../runtimeStore";
import { addFiles, parseUploadFiles } from "../services/fileService";
import { getZipManifestContents } from "../services/zipService";
import { acceptStyle, baseStyle, focusedStyle, rejectStyle } from "./style";
//use-file-picker
//react-drag-drop-files

export function FilePicker() {

  return (
    <Dropzone
      useFsAccessApi={false}
      onDropAccepted={(files, event) => {
        if (files.length === 1 && files[0].name.endsWith('.zip')) {
          getZipManifestContents(files[0]).then((result) => {
            addFiles(configurationWebSP, "tests", result.data).then((result) => {
              console.log(result);
            });
          });
          return;
        }
        parseUploadFiles(files).then((result) => {
          console.log(result);
        });
      }}
      onDrop={async (acceptedFiles) => {
        console.log(acceptedFiles);
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
          <Button appearance='primary' onClick={open}>
            Browse
          </Button>
        </div>
      )}
    </Dropzone>
  );
}
