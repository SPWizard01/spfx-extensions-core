import { useDropzone } from "react-dropzone";
import { configurationWebSP } from "../runtimeStore";
import { addFiles, parseUploadFiles } from "../services/fileService";
import { getZipManifestContents } from "../services/zipService";
//use-file-picker
//react-drag-drop-files

export function FilePicker() {
  const { getRootProps, getInputProps, acceptedFiles, open } = useDropzone({
    onDropAccepted(files, event) {
      if(files.length === 1 && files[0].name.endsWith(".zip")) {
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
