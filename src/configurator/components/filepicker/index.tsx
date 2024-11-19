import { useEffect, useState } from "react";
import DropZone, { useDropzone } from "react-dropzone";
import { getManifestFromZip } from "../../services/zipService";
//use-file-picker
//react-drag-drop-files
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
        onDrop={(acceptedFiles) => console.log(acceptedFiles[0])}
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
