import { logGenericCoreError } from "./loggingService";

export async function getDigest(webUrl: string) {
    const req = await fetch(
        `${webUrl}/_api/contextinfo`,
        {
            method: "POST",
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json",
            },
        }
    );
    if (req.status === 200) {
        const data = await req.json();
        return data.d.GetContextWebInformation.FormDigestValue;
    } else {
        logGenericCoreError("Error while getting digest", req.status);
    }
    return "";
}