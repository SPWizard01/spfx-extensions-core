import { getCoreDefaultConfiguration, type ConfigurationListData } from "../../models/configurationList";
import { CONFIGURATION_LIST_NAME, SPFX_EXTENSIONS_DATA_SITE, SPFxExtensionCore } from "../../utilities/constants";
import { getAppCatalogDigest, getAppCatalogUrlCached } from "./appCatalogService";
import { addOrUpdateExtensionConfigs, getAllExtensionConfig } from "./coreIdbService";

const RUNTIME_CONFIG_ITEMCOUNT = 3;
const MINIMAL_CONFIG_COUNT = getCoreDefaultConfiguration("").length + RUNTIME_CONFIG_ITEMCOUNT;
const appCatalogUrl = await getAppCatalogUrlCached();
const appCatalogDigest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);
const spfxConfigWebUrl = `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}`;


let configurationListDataPromise: Promise<ConfigurationListData[]> | undefined;

async function ensureConfigurationListDataField() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')/fields
    const fieldsUrl = `${spfxConfigWebUrl}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/fields`;
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
            const fieldNames = fields.map((f: any) => f.InternalName);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const titleField = fields.find((f: any) => f.InternalName === "Title");
            if (!titleField) {
                console.error(SPFxExtensionCore, "Title field not found.");
                return;
            }
            if (!titleField.EnforceUniqueValues) {
                // Update the Title field
                const updateFieldReq = await fetch(
                    `${spfxConfigWebUrl}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/fields('${titleField.Id}')`,
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json;odata=verbose",
                            "Content-Type": "application/json;odata=verbose",
                            "X-RequestDigest": appCatalogDigest,
                            "X-HTTP-Method": "MERGE",
                            "If-Match": "*",
                        },
                        body: JSON.stringify({
                            __metadata: {
                                type: "SP.Field",
                            },
                            Indexed: true,
                            EnforceUniqueValues: true,
                        }),
                    }
                );
                if (updateFieldReq.status === 204) {
                    console.info(SPFxExtensionCore, "Title field updated successfully.");
                } else {
                    console.error(SPFxExtensionCore, "Unable to update Title field.");
                }
            }
            if (!fieldNames.includes("Data")) {
                // Add the Data field
                const addFieldReq = await fetch(
                    fieldsUrl,
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json;odata=verbose",
                            "Content-Type": "application/json;odata=verbose",
                            "X-RequestDigest": appCatalogDigest,
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
                    console.error(SPFxExtensionCore, "Unable to add Data field.");
                }
            }
        }
    }
    catch (err) {
        console.error(SPFxExtensionCore, "Error while ensuring configuration list data fields.", err);
    }
}

async function ensureConfigurationList() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')
    let newList = false;
    try {
        const req = await fetch(
            `${spfxConfigWebUrl}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')`
        );
        newList = req.status === 404;
        if (newList) {
            console.log(SPFxExtensionCore, "Creating configuration list.");
            // Create the list
            const createReq = await fetch(
                `${spfxConfigWebUrl}/_api/web/lists`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": appCatalogDigest,
                    },
                    body: JSON.stringify({
                        "__metadata": {
                            type: "SP.List",
                        },
                        // AllowContentTypes: false,
                        // ContentTypesEnabled: false,
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
    return newList;
}


async function getConfigurationListItems() {
    const requestUrl = `${spfxConfigWebUrl}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/items?$select=Title,Data`;
    const config = {
        headers: {
            Accept: "application/json;odata=verbose",
        }
    }
    let req = await fetch(
        requestUrl, {
        ...config
    }
    );
    if (req.status !== 200) {
        console.error(SPFxExtensionCore, "Unable to fetch configuration list items.");
        return [];
    }
    let data = await req.json();
    let results = data.d.results as ConfigurationListData[];
    return results;
}

async function createDefaultListItems() {
    for (const item of getCoreDefaultConfiguration(spfxConfigWebUrl)) {
        const addReq = await fetch(
            `${spfxConfigWebUrl}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/items`, {
            method: "POST",
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": appCatalogDigest,
            },
            body: JSON.stringify({
                "__metadata": {
                    type: "SP.Data.SPFxExtensionsConfigurationListItem"
                },
                ...item,
            })
        }
        );
        if (addReq.status === 201) {
            console.info(SPFxExtensionCore, `Item ${item.Title} added successfully.`);
        } else {
            console.error(SPFxExtensionCore, `Unable to add item ${item.Title}.`);
        }
    }
}



export function getConfigurationListData() {
    if (configurationListDataPromise) {
        return configurationListDataPromise;
    }
    configurationListDataPromise = getConfigurationListDataCached();
    return configurationListDataPromise;
}


async function getConfigurationListDataCached() {
    let allConfig = await getAllExtensionConfig();
    if (allConfig.length < MINIMAL_CONFIG_COUNT) {
        const isNewList = await ensureConfigurationList();
        if (isNewList) {
            await createDefaultListItems();
        }
        const allListData = await getConfigurationListItems();
        await addOrUpdateExtensionConfigs(allListData, 240);
        allConfig = await getAllExtensionConfig()
    }
    return allConfig;
}
