import { CONFIGURATOR_APP_INSTANCEID, CORE_APP_ID, CONFIGURATOR_APP_ID, APP_CATALOG } from "../utilities/coreConstants";
import { getAppCatalogDigest } from "./configurationService";
const configuratorPage = "SitePages/SPFxExtensionsConfigurator.aspx";
const acceptHeader = { "accept": "application/json", }
let digest = "";
async function ensureDigest() {
    if (!digest) {
        digest = await getAppCatalogDigest();
    }
    return digest;
}

async function getDigestHeader() {
    const currentDigest = await ensureDigest();
    return { "X-RequestDigest": currentDigest };
}

async function createFullPage() {
    const response = await fetch(`${APP_CATALOG}/_api/sitepages/pages`, {
        "headers": {
            ...acceptHeader,
            ...(await getDigestHeader()),
            "Content-Type": "application/json"
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
    const response = await fetch(`${APP_CATALOG}/_api/sitepages/pages/GetByUrl('${configuratorPage}')`, {
        "headers": {
            ...acceptHeader,
        },
        "method": "GET",
    });
    if (response.status === 404) {
        return undefined;
    }
    const data = await response.json();
    return data.d;
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
    Title: "SPFxExtensionsConfigurator",
}

async function setPageContent(pageId: number) {
    await fetch(`${APP_CATALOG}/_api/sitepages/pages(${pageId})/savepage`, {
        "headers": {
            "Content-Type": "application/json",
            ...acceptHeader,
            ...(await getDigestHeader()),
        },
        "body": JSON.stringify(save),
        "method": "POST",
    });
    await fetch(`${APP_CATALOG}/_api/sitepages/pages(${pageId})/publish`, {
        "headers": {
            ...acceptHeader,
            ...(await getDigestHeader()),
        },
        "method": "POST",
    })
}

async function createConfiguratorPage() {
    const pageId = await createFullPage();
    await setPageContent(pageId);
    return getConfiguratorPageData();
}


export async function ensureConfiguratorPage() {
    const data = await getConfiguratorPageData();
    if (!data) {
        return createConfiguratorPage();
    }
    if(data.CanvasContent1.indexOf(CONFIGURATOR_APP_INSTANCEID) === -1) {
        await setPageContent(data.Id);
        return getConfiguratorPageData();
    }
    return data;
}
