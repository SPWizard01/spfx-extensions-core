import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { getWebAbsoluteUrl } from "../../../core/services/contextService";
import { addFiles, parseUploadFiles } from "../../services/fileService";
import { getPnPSP } from "../../services/pnpService";
import { getConfiguringWebUrl } from "../../services/webConfiguratorService";
import { getZipManifestContents } from "../../services/zipService";
//use-file-picker
//react-drag-drop-files
const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();
const sp = getPnPSP(cfgWeb);

export function FilePicker() {
  const { getRootProps, getInputProps, acceptedFiles, open } = useDropzone({
    onDropAccepted(files, event) {
      if(files.length === 1 && files[0].name.endsWith(".zip")) {
        getZipManifestContents(files[0]).then((result) => {
          addFiles(sp, "tests", result.data).then((result) => {
            console.log(result);
          });
        });
        return;
      }
      parseUploadFiles(files).then((result) => {
        console.log(result);
      });
    }, 
    useFsAccessApi: true,
    // onDrop(acceptedFiles, fileRejections, event) {
    //   console.log(acceptedFiles);
      
    // },
  });
  return (
    <>
      <br />
      <div {...getRootProps()}>
        <input {...getInputProps({})} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
    </>
  );
}
