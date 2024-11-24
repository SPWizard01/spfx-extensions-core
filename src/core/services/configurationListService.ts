import type { ConfigurationListData } from "../../models/configurationList";
import { CONFIGURATION_LIST_NAME, SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { ConfigurationNames, getCoreDefaultConfiguration } from "../utility/defaultConfig";
import { getAppCatalogDigest, SPFX_EXTENSIONS_SITE_URL } from "./appCatalogService";
import { addOrUpdateExtensionConfigs, getAllExtensionConfigFromDB } from "./coreIdbService";
import { logGenericCoreError, logGenericCoreInfo } from "./loggingService";

const MINIMAL_CONFIG_COUNT = Object.keys(ConfigurationNames).length;
const appCatalogDigest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);


let configurationListDataPromise: Promise<ConfigurationListData[]> | undefined;

async function ensureConfigurationListDataField() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')/fields
    const fieldsUrl = `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/fields`;
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
                logGenericCoreError("Title field not found.");
                return;
            }
            if (!titleField.EnforceUniqueValues) {
                // Update the Title field
                const updateFieldReq = await fetch(
                    `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/fields('${titleField.Id}')`,
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
                    logGenericCoreInfo("Title field updated successfully.");
                } else {
                    logGenericCoreError("Unable to update Title field.");
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
                    logGenericCoreInfo("Data field added successfully.");
                } else {
                    logGenericCoreError("Unable to add Data field.");
                }
            }
        }
    }
    catch (err) {
        logGenericCoreError("Error while ensuring configuration list data fields.", err);
    }
}

async function ensureConfigurationList() {
    // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')
    let newList = false;
    try {
        const req = await fetch(
            `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')`
        );
        newList = req.status === 404;
        if (newList) {
            logGenericCoreInfo("Creating configuration list.");
            // Create the list
            const createReq = await fetch(
                `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists`,
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
                logGenericCoreInfo("Configuration list created successfully.");

            } else {
                logGenericCoreError("Unable to create configuration list.");
            }
        }
        await ensureConfigurationListDataField();
    }
    catch (err) {
        logGenericCoreError("Error while ensuring configuration list.", err);
    }
    return newList;
}


async function getConfigurationListItemsFromAPI() {
    const requestUrl = `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/items?$select=Title,Data`;
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
        logGenericCoreError("Unable to fetch configuration list items.");
        return [];
    }
    let data = await req.json();
    let results = data.d.results as ConfigurationListData[];
    return results;
}

async function createDefaultListItems() {
    for (const item of getCoreDefaultConfiguration(SPFX_EXTENSIONS_SITE_URL)) {
        const addReq = await fetch(
            `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/items`, {
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
            logGenericCoreInfo(`Item ${item.Title} added successfully.`);
        } else {
            logGenericCoreError(`Unable to add item ${item.Title}.`);
        }
    }
}



export function getConfigurationListData(fresh = false) {
    if(fresh) {
        return getConfigurationListItemsFromAPI();
    }
    if (configurationListDataPromise) {
        return configurationListDataPromise;
    }
    configurationListDataPromise = getConfigurationListDataCached();
    return configurationListDataPromise;
}


async function getConfigurationListDataCached() {
    let allConfig = await getAllExtensionConfigFromDB();
    if (allConfig.length < MINIMAL_CONFIG_COUNT) {
        const isNewList = await ensureConfigurationList();
        if (isNewList) {
            await createDefaultListItems();
        }
        const allListData = await getConfigurationListItemsFromAPI();
        await addOrUpdateExtensionConfigs(allListData, 240);
        allConfig = await getAllExtensionConfigFromDB()
    }
    return allConfig;
}
