import { useEffect, useState } from "react";
import DropZone, { useDropzone } from "react-dropzone";
import { getWebAbsoluteUrl } from "../../../core/services/contextService";
import { addFile } from "../../services/fileService";
import { getPnPSP } from "../../services/pnpService";
import { getConfiguringWebUrl } from "../../services/webConfiguratorService";
import { getManifestFromZip } from "../../services/zipService";
//use-file-picker
//react-drag-drop-files
const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();
const sp = getPnPSP(cfgWeb);

export function FilePicker() {
  const [file, setFile] = useState<File | null>(null);
  const handleChange = (file: any) => {
    setFile(file);
  };
  useEffect(() => {
    if (!file) return;
    getManifestFromZip(file);
  }, [file]);

  return (
    <>
      <br />
      <DropZone
        onDrop={(acceptedFiles) => {
          console.log(acceptedFiles);
          // if(acceptedFiles[0]){
          //   getManifestFromZip(acceptedFiles[0]).then((result) => {
          //     console.log(result);
          //     const fl = result.files[9];
          //     // console.log(fl);
          //     addFile(sp, "GG", fl.fileName, fl.content);
          //   });
          // }
        }}
        useFsAccessApi={true}
      >
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <p>Drag 'n' drop some files here, or click to select files</p>
          </div>
        )}
      </DropZone>
    </>
  );
}
