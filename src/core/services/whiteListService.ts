import { ALLOWEDAPPSLIST_NAME, SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { getAppCatalogDigest, getAppCatalogUrlCached } from "./appCatalogService";
import { addOrUpdateExtensionConfig, getExtensionConfig } from "./coreIdbService";
import { logGenericCoreError, logGenericCoreInfo } from "./loggingService";


const appCatalogUrl = await getAppCatalogUrlCached();
const digest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);

const webUrl = `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}`;

async function ensureAppWhiteListFields() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')/fields
    const fieldsUrl = `${webUrl}/_api/web/lists/GetByTitle('${ALLOWEDAPPSLIST_NAME}')/fields`;
    try {
        const req = await fetch(
            fieldsUrl,
            {
                headers: {
                    Accept: "application/json;odata=verbose",
                },
            }
        );
        if (req.status === 200) {
            const data = await req.json();
            const fields = data.d.results;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fieldNames = fields.map((f: any) => f.InternalName) as string[];
            if (!fieldNames.some((internalName) => internalName === "EntryPointUrl")) {
                await ensureMultiLineField(fieldsUrl, "EntryPointUrl", "Full URL to the Entrypoint JS file, if * is specified all entries will be allowed.", true);
            }
        }
    }
    catch (err) {
        logGenericCoreError("Error while ensuring list fields.", err);
    }
}
async function ensureTextField(fieldsUrl: string, fieldInternalName: string, required: boolean, digestValue: string) {
    const addFieldReq = await fetch(
        fieldsUrl,
        {
            method: "POST",
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": digestValue,
            },
            body: JSON.stringify({
                __metadata: {
                    type: "SP.Field",
                },
                Title: fieldInternalName,
                FieldTypeKind: 2,
                Required: required,
            }),
        }
    );
    if (addFieldReq.status === 201) {
        logGenericCoreError(fieldInternalName, "field added successfully.");
    } else {
        logGenericCoreError(fieldInternalName, "Unable to add field.");
    }
}
async function ensureMultiLineField(fieldsUrl: string, fieldInternalName: string, description: string, required: boolean) {
    const addFieldReq = await fetch(
        fieldsUrl,
        {
            method: "POST",
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": digest,
            },
            body: JSON.stringify({
                __metadata: {
                    type: "SP.Field",
                },
                Title: fieldInternalName,
                FieldTypeKind: 3,
                Required: required,
                Description: description
            }),
        }
    );
    if (addFieldReq.status === 201) {
        logGenericCoreInfo(fieldInternalName, "field added successfully.");
    } else {
        logGenericCoreError(fieldInternalName, "Unable to add field.");
    }
}
async function createAppWhiteList() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')
    try {
        const req = await fetch(`${webUrl}/_api/web/lists/GetByTitle('${ALLOWEDAPPSLIST_NAME}')?$select=*`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json;odata=verbose",
                }
            }
        );
        const newList = req.status === 404;
        if (newList) {
            logGenericCoreInfo("Creating app white list.");
            // Create the list
            const createReq = await fetch(
                `${webUrl}/_api/web/lists`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": digest,
                    },
                    body: JSON.stringify({
                        "__metadata": {
                            type: "SP.List",
                        },
                        // AllowContentTypes: false,
                        // ContentTypesEnabled: false,
                        BaseTemplate: 100,
                        Title: ALLOWEDAPPSLIST_NAME,
                        Description: "App whitelist for SPFxExtensions",
                    }),
                }
            );
            if (createReq.status === 201) {
                logGenericCoreInfo("App whitelist created successfully.");
                return createReq.json();
            } else {
                logGenericCoreError("Unable to create app whitelist.");
                return undefined;
            }
        }
        await ensureAppWhiteListFields();
        return req.json();
    }
    catch (err) {
        logGenericCoreError("Error while ensuring app whitelist.", err);
    }
    return undefined;
}

export async function ensureAppWhiteList() {
    const cachedData = await getExtensionConfig("AppWhiteList");
    if (cachedData?.Data) {
        return cachedData.Data;
    }
    const apiData = await createAppWhiteList();
    if (apiData) {
        await addOrUpdateExtensionConfig({ Title: "AppWhiteList", Data: apiData, date: "", expires: "" }, 480);
    }
    return apiData;
}





