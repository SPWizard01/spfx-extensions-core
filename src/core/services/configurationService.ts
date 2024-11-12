import { ALLOWEDAPPSLIST_NAME, APP_CATALOG, SPFxExtensionCore } from "../../utilities/constants"

async function ensureAppWhiteListFields(digestValue: string) {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')/fields
    const fieldsUrl = `${APP_CATALOG}/_api/web/lists/GetByTitle('${ALLOWEDAPPSLIST_NAME}')/fields`;
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
            if (fieldNames.some((internalName) => internalName !== "EntryPointUrl")) {
                await ensureMultiLineField(fieldsUrl, "EntryPointUrl", "Full URL to the Entrypoint JS file, if * is specified all entries will be allowed.", true, digestValue);
            }
        }
    }
    catch (err) {
        console.error(SPFxExtensionCore, "Error while ensuring list fields.", err);
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
        console.info(SPFxExtensionCore, fieldInternalName, "field added successfully.");
    } else {
        console.error(SPFxExtensionCore, fieldInternalName, "Unable to add field.");
    }
}
async function ensureMultiLineField(fieldsUrl: string, fieldInternalName: string, description: string, required: boolean, digestValue: string) {
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
                FieldTypeKind: 3,
                Required: required,
                Description: description
            }),
        }
    );
    if (addFieldReq.status === 201) {
        console.info(SPFxExtensionCore, fieldInternalName, "field added successfully.");
    } else {
        console.error(SPFxExtensionCore, fieldInternalName, "Unable to add field.");
    }
}

export async function ensureAppWhiteList() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')
    try {
        const req = await fetch(
            `${APP_CATALOG}/_api/web/lists/GetByTitle('${ALLOWEDAPPSLIST_NAME}')`
        );
        const dgst = await getDigest();
        let newList = false;
        if (req.status === 404) {
            newList = true;
            console.log(SPFxExtensionCore, "Creating app white list.");
            // Create the list
            const createReq = await fetch(
                `${APP_CATALOG}/_api/web/lists`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": dgst,
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
                console.info("Configuration list created successfully.");

            } else {
                console.error("Unable to create configuration list.");
            }
        }
        await ensureAppWhiteListFields(dgst);
    }
    catch (err) {
        console.error(SPFxExtensionCore, "Error while ensuring configuration list.", err);
    }
}


async function getDigest() {
    const req = await fetch(
        `${APP_CATALOG}/_api/contextinfo`,
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
    }
    return "";
}