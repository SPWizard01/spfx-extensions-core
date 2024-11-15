import { CONFIGURATOR_APP_ID, CONFIGURATOR_APP_INSTANCEID, CONFIGURATOR_PAGE_NAME, CONFIGURATOR_PAGE_URL, CORE_APP_ID, SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { getAppCatalogDigest, getAppCatalogUrlCached } from "./appCatalogService";
import { addOrUpdateExtensionConfig, getExtensionConfig } from "./coreIdbService";

const appCatalogUrl = await getAppCatalogUrlCached();
const digest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);
const webUrl = `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}`;



const acceptHeader = { "accept": "application/json", }
const digestHeader = { "X-RequestDigest": digest }
const contentType = { "Content-Type": "application/json" }
async function createFullPage() {
    const response = await fetch(`${webUrl}/_api/sitepages/pages`, {
        "headers": {
            ...acceptHeader,
            ...digestHeader,
            ...contentType
        },
        "body": JSON.stringify({
            PageLayoutType: "SingleWebPartAppPage",
            PromotedState: 0
        }),
        "method": "POST",
    });
    const data = await response.json();
    return data.Id;
}

async function getConfiguratorPageData() {
    const response = await fetch(`${webUrl}/_api/sitepages/pages/GetByUrl('${CONFIGURATOR_PAGE_URL}')`, {
        "headers": {
            ...acceptHeader,
        },
        "method": "GET",
    });
    if (response.status === 404) {
        return undefined;
    }
    const data = await response.json();
    return data;
}

const layout = [
    {
        dataVersion: "1.4",
        description: "Title Region Description",
        id: "cbe7b0a9-3504-44dd-a3a3-0e5cacd07788",
        instanceId: "cbe7b0a9-3504-44dd-a3a3-0e5cacd07788",
        properties: {
            authorByline: [],
            authors: [],
            layoutType: "FullWidthImage",
            showPublishDate: false,
            showTopicHeader: false,
            textAlignment: "Left",
            title: "SPFx Extensions Configurator",
            topicHeader: "",
            enableGradientEffect: true
        },
        reservedHeight: 280,
        serverProcessedContent: {
            htmlStrings: {},
            searchablePlainTexts: {},
            imageSources: {},
            links: {}
        },
        title: "Title area"
    }
]

const canvas = [
    {
        addedFromPersistedData: false,
        controlType: 3,
        displayMode: 2,
        emphasis: {},
        id: CONFIGURATOR_APP_INSTANCEID,
        position: {
            controlIndex: 1,
            layoutIndex: 1,
            sectionFactor: 12,
            sectionIndex: 1,
            zoneIndex: 1
        },
        reservedHeight: 500,
        reservedWidth: 500,
        webPartData: {
            dataVersion: "1.0",
            description: "Allows you to add a custom developed app",
            id: CORE_APP_ID,
            instanceId: CONFIGURATOR_APP_INSTANCEID,
            properties: {
                description: "Select an app to load from the dropdown below",
                selectedApp: CONFIGURATOR_APP_ID,
                SPFxExtensionAppConfiguration: undefined
            },
            title: "SPFx Extension Loader"
        },
        webPartId: CORE_APP_ID
    },
    {
        controlType: 0,
        pageSettingsSlice: {
            isDefaultDescription: true,
            isDefaultThumbnail: true
        }
    }
]


const save = {
    CanvasContent1: `${JSON.stringify(canvas)}`,
    LayoutWebpartsContent: `${JSON.stringify(layout)}`,
    Title: CONFIGURATOR_PAGE_NAME,
}

async function setPageContent(pageId: number) {
    await fetch(`${webUrl}/_api/sitepages/pages(${pageId})/savepage`, {
        "headers": {
            "Content-Type": "application/json",
            ...acceptHeader,
            ...digestHeader
        },
        "body": JSON.stringify(save),
        "method": "POST",
    });
    await fetch(`${webUrl}/_api/sitepages/pages(${pageId})/publish`, {
        "headers": {
            ...acceptHeader,
            ...digestHeader
        },
        "method": "POST",
    })
}

async function createConfiguratorPage() {
    const pageId = await createFullPage();
    await setPageContent(pageId);
    return getConfiguratorPageData();
}

async function getConfiguratorPageDataCached() {
    const cachedData = await getExtensionConfig("ConfiguratorPageData");
    if (cachedData?.Data) {
        return cachedData.Data;
    }
    const apiData = await getConfiguratorPageData();
    if (apiData) {
        await addOrUpdateExtensionConfig({ Title: "ConfiguratorPageData", Data: apiData, date: "", expires: "" }, 480);
    }
    return apiData;
}


export async function ensureConfiguratorPage() {
    const data = await getConfiguratorPageDataCached();
    if (!data) {
        return createConfiguratorPage();
    }
    if (data.CanvasContent1.indexOf(CONFIGURATOR_APP_INSTANCEID) === -1) {
        await setPageContent(data.Id);
        const refreshData = await getConfiguratorPageData();
        await addOrUpdateExtensionConfig({ Title: "ConfiguratorPageData", Data: refreshData, date: "", expires: "" }, 480);
        return refreshData;
    }
    return data;
}
