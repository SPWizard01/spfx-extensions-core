import { unzip, type Unzipped, } from "fflate";
import { MANIFEST_NAME } from "../../utilities/constants";

export interface UnzippedFile {
    fileName: string;
    content: Uint8Array;
}
interface ZipContentResult {
    files: UnzippedFile[];
    warnings: string[];
    error: string;
    isError: boolean;
}
export async function getManifestFromZip(data: File): Promise<ZipContentResult> {
    const buffer = await data.arrayBuffer();
    const result: ZipContentResult = {
        files: [],
        warnings: [],
        error: "",
        isError: false,
    };
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
        result.error = `${error}`;
        result.isError = true;
        return result;
    }

    const fileNames: string[] = [];
    Object.keys(unzippedFiles).forEach((key: string) => {
        fileNames.push(key);
    });
    // dist/somdir/manifest.txt
    const manifestFile = fileNames.find((fileName) => fileName.toLowerCase().endsWith(MANIFEST_NAME));

    if (!manifestFile) {
        result.error = "No manifest file found in the zip";
        result.isError = true;
        return result;
    }
    const basePathIdx = manifestFile.lastIndexOf("/");
    let basePath = "";
    if (basePathIdx > -1) {
        //dist/somdir/
        basePath = manifestFile.substring(0, basePathIdx + 1);
    }
    const nonBasePathFiles = fileNames.filter((name) => !name.startsWith(basePath));
    const basePathFiles = fileNames.filter((name) => name.startsWith(basePath));
    if (nonBasePathFiles.length > 0) {
        result.warnings.push("Some files are not in the root directory and wont be included.");
        result.warnings.push(...nonBasePathFiles.map((file) => `File: ${file}`));
    }
    basePathFiles.forEach((name) => {
        const content = unzippedFiles[name];
        const fileName = name.substring(basePath.length);
        if (content.length > 0) {
            result.files.push({ fileName, content });
        }
    });
    // const manifest = unzippedFiles[manifestFile];
    // //file content
    // const a = new TextDecoder().decode(manifest);
    // console.log(basePath, a);
    return result;
}
