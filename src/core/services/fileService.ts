import { getDigest } from "./digestService";
const acceptHeader = {
    "Accept": "application/json;odata=nometadata",
}
const postHeaders = {
    ...acceptHeader,
    "Content-Type": "application/json",
}
export async function getFileByTitle(webUrl: string, listName: string, fileName: string) {
    const response = await fetch(`${webUrl}/_api/web/lists/GetByTitle('${listName}')/rootFolder/files('${fileName}')`, {
        method: "GET",
        headers: {
            ...acceptHeader,
        }
    });
    if (!response.ok) {
        return undefined;
    }
    return response.json();
}

export async function setFileContent(webUrl: string, listName: string, fileName: string, content: string) {
    const digest = await getDigest(webUrl);
    const response = await fetch(`${webUrl}/_api/web/lists/GetByTitle('${listName}')/rootFolder/files('${fileName}')/$value`, {
        method: "POST",
        headers: {
            ...postHeaders,
            "X-RequestDigest": digest,
        },
        body: JSON.stringify(content)
    });
    if (!response.ok) {
        return undefined;
    }
    return response.json();
}

export async function addFile(webUrl: string, listName: string, fileName: string, subFolderPath: string = "") {
    const digest = await getDigest(webUrl);
    const subFolderQuery = subFolderPath ? `/folders('${subFolderPath}')` : "";
    const response = await fetch(`${webUrl}/_api/web/lists/GetByTitle('${listName}')/rootFolder${subFolderQuery}/files/AddUsingPath(decodedurl='${fileName}')`, {
        method: "POST",
        headers: {
            ...postHeaders,
            "X-RequestDigest": digest,
        },
    });
    if (!response.ok) {
        return undefined;
    }
    return response.json();
}

export async function createSubFolder(webUrl: string, listName: string, folderName: string) {
    const digest = await getDigest(webUrl);
    const response = await fetch(`${webUrl}/_api/web/lists/GetByTitle('${listName}')/rootFolder/AddSubFolderUsingPath`, {
        method: "POST",
        headers: {
            ...postHeaders,
            "X-RequestDigest": digest,
        },
        body: JSON.stringify({ leafPath: { DecodedUrl: decodeURIComponent(folderName) } })
    });
    if (!response.ok) {
        return undefined;
    }
    return response.json();
}

export async function getSubFolder(webUrl: string, listName: string, folderName: string) {
    const response = await fetch(`${webUrl}/_api/web/lists/GetByTitle('${listName}')/rootFolder/folders('${folderName}')`, {
        method: "GET",
        headers: {
            ...acceptHeader
        },
    });
    if (!response.ok) {
        return undefined;
    }
    return response.json();
}