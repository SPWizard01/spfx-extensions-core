import { gzip, unzip, type Unzipped, } from "fflate";
import { MANIFEST_NAME } from "../../utilities/constants";
export async function getManifestFromZip(data: File) {
    const buffer = await data.arrayBuffer();

    const unzipPromise = new Promise<Unzipped>((resolve, reject) => {
        unzip(new Uint8Array(buffer), (err, unzipped) => {
            if (err) {
                reject(err);
            }
            resolve(unzipped);
        });
    });
    let unzippedFiles: Unzipped | undefined = undefined;
    try {
        unzippedFiles = await unzipPromise;
    }
    catch (error) {
        console.error(error);
        return;
    }
    
    const fileNames: string[] = [];
    Object.keys(unzippedFiles).forEach((key: string) => {
        fileNames.push(key);
    });
    // dist/somdir/manifest.txt
    const manifestFile = fileNames.find((fileName) => fileName.toLowerCase().endsWith(MANIFEST_NAME));

    if (!manifestFile) {
        console.error("No manifest file found in the zip");
        return;
    }
    const basePathIdx = manifestFile.lastIndexOf("/");
    let basePath = "";
    if (basePathIdx > -1) {
        //dist/somdir/
        basePath = manifestFile.substring(0, basePathIdx + 1);
    }
    const manifest = unzippedFiles[manifestFile];
    //file content
    const a = new TextDecoder().decode(manifest);
    console.log(basePath, a);

}
