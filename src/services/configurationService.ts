import { CONFIGURATION_LIST_NAME, SPFxExtensionCore } from "../utilities/constants";

export async function ensureConfigurationListDataField() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')/fields
    const fieldsUrl = `/sites/appcatalog/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/fields`;
    try {
        const req = await fetch(
            fieldsUrl
        );
        if (req.status === 200) {
            const data = await req.json();
            const fields = data.value;
            const fieldNames = fields.map((f: any) => f.Title);
            if (!fieldNames.includes("Data")) {
                // Add the Title field
                const addFieldReq = await fetch(
                    fieldsUrl,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            __metadata: {
                                type: "SP.Field",
                            },
                            Title: "Data",
                            FieldTypeKind: 2,
                            Required: true,
                        }),
                    }
                );
                if (addFieldReq.status === 201) {
                    console.info(SPFxExtensionCore, "Data field added successfully.");
                } else {
                    console.error(SPFxExtensionCore, "Unable to add Title field.");
                }
            }
        }
    }
    catch (err) {
        console.error(SPFxExtensionCore, "Error while ensuring configuration list data fields.", err);
    }
}

export async function ensureConfigurationList() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')
    try {
        const req = await fetch(
            `/sites/appcatalog/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')`
        );
        if (req.status === 404) {
            // Create the list
            const createReq = await fetch(
                "/sites/appcatalog/_api/web/lists",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        __metadata: {
                            type: "SP.List",
                        },
                        BaseTemplate: 100,
                        Title: "SPFxExtensionsConfiguration",
                        Description: "Configuration list for SPFxExtensions",
                    }),
                }
            );
            if (createReq.status === 201) {
                console.info("Configuration list created successfully.");
            } else {
                console.error("Unable to create configuration list.");
            }
        }
        await ensureConfigurationListDataField();
    }
    catch (err) {
        console.error(SPFxExtensionCore, "Error while ensuring configuration list.", err);
    }
}