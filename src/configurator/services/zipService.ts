import { unzip, type Unzipped, } from "fflate";
import { MANIFEST_NAME } from "../../utilities/constants";
import type { ApiCallResult } from "../models/apiCallResult";
import type { FileContents } from "./fileService";



export async function getZipManifestContents(data: File): Promise<ApiCallResult<FileContents[]>> {
    const buffer = await data.arrayBuffer();
    const result: ApiCallResult<FileContents[]> = {
        data: [],
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
    let manifestFile = fileNames.find((fileName) => fileName.toLowerCase().endsWith(MANIFEST_NAME));

    if (!manifestFile) {
        result.warnings.push("No manifest file found in the zip.");
        manifestFile = ""
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
        const content = unzippedFiles[name] as Uint8Array<ArrayBuffer>;
        const fileName = name.substring(basePath.length);
        if (content.length > 0) {
            result.data.push({ fileName, content });
        }
    });
    // const manifest = unzippedFiles[manifestFile];
    // //file content
    // const a = new TextDecoder().decode(manifest);
    // console.log(basePath, a);
    return result;
}
