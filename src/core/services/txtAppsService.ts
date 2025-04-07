import type { AppCollectionManifest, ManifestLocation } from "../../models/cache";
import { APPCOLLECTION_MANIFEST_NAME, SPFxExtensionCore, WELL_KNOWN_MANIFEST_LOCATION } from "../../utilities/constants";
import { isInDebug } from "../../utilities/debug";
import { getContentDigest } from "../../utilities/digest";
import { getRootCDNLocation } from "./coreConfigService";
import { getAppCollectionTXTFromCache, setOrUpdateAppCollectionTXT } from "./coreIdbService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreWarning } from "./loggingService";

function validateAppTXT(manifest: string[]) {
    if (!Array.isArray(manifest)) {
        throw `${SPFxExtensionCore} App manifest should be an array of strings`;
    }
    if (
        manifest.some((v) => {
            return typeof v !== "string";
        })
    ) {
        throw `${SPFxExtensionCore} App manifest should only contain strings`;
    }
}

async function fetchAndCacheAppsTXT(
    url: string,
    name: string,
    type: ManifestLocation,
    isHubFetch: boolean,
    skipCache = false,
    cacheTimeMinutes = 60
): Promise<AppCollectionManifest> {
    let appCollection: string[] = [];
    const fetchLocation = url.toLowerCase();
    if (!skipCache && !isInDebug) {
        const cachedManifest = await getAppCollectionTXTFromCache(fetchLocation);
        if (cachedManifest) {
            cachedManifest.isHubFetch = isHubFetch;
            return cachedManifest;
        }
    }
    try {
        logGenericCoreDebug(`Fetching ${APPCOLLECTION_MANIFEST_NAME} from`, fetchLocation);
        const mnfReq = await fetch(fetchLocation);
        const result = await mnfReq.json();
        appCollection = result;

    } catch (err) {
        logGenericCoreWarning(`Unable to fetch ${APPCOLLECTION_MANIFEST_NAME} from`, fetchLocation, err);
    }
    try {
        validateAppTXT(appCollection);
    } catch (err) {
        logGenericCoreError(`Error while parsing ${APPCOLLECTION_MANIFEST_NAME} from`, fetchLocation, err);
        appCollection = [];
    }
    const hash = await getContentDigest(JSON.stringify(appCollection));
    const baseResult = {
        name,
        url: fetchLocation,
        type,
        hash,
    };

    const retResult: AppCollectionManifest = { appCollection, ...baseResult };
    await setOrUpdateAppCollectionTXT(retResult, isInDebug ? 1 : cacheTimeMinutes);
    //assign later so we dont save to cache.
    retResult.isHubFetch = isHubFetch;
    return retResult;
}

export async function fetchAppsTXTFromAllLocations(
    siteUrl: string,
    webUrl: string,
    hubUrl: string,
    skipCache = false
): Promise<AppCollectionManifest[]> {
    // all apps.txt accross the context (root / site /web)
    const allAppManifests: Promise<AppCollectionManifest>[] = [];
    const rootLocation = await getRootCDNLocation();
    // const rootUrl = `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}`;
    allAppManifests.push(
        fetchAndCacheAppsTXT(
            rootLocation,
            "apps",
            // rootUrl,
            "root",
            true,
            skipCache
        )
    );

    const normalizedSiteUrl = siteUrl + WELL_KNOWN_MANIFEST_LOCATION;

    allAppManifests.push(
        fetchAndCacheAppsTXT(
            `${normalizedSiteUrl}${APPCOLLECTION_MANIFEST_NAME}`,
            "apps",
            // siteUrl,
            "site",
            false,
            skipCache
        )
    );

    if (hubUrl) {
        const normalizedHubUrl = hubUrl + WELL_KNOWN_MANIFEST_LOCATION;
        allAppManifests.push(
            fetchAndCacheAppsTXT(
                `${normalizedHubUrl}${APPCOLLECTION_MANIFEST_NAME}`,
                "apps",
                // hubUrl,
                "site",
                true,
                skipCache
            )
        );
    }

    const normalizedWebUrl = webUrl + WELL_KNOWN_MANIFEST_LOCATION;
    const fullWebUrl = `${normalizedWebUrl}${APPCOLLECTION_MANIFEST_NAME}`;
    const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
    const webIsRoot = fullWebUrl.toLowerCase() === rootLocation.toLowerCase();
    if (!siteIsWeb && !webIsRoot) {
        allAppManifests.push(
            fetchAndCacheAppsTXT(
                fullWebUrl,
                "apps",
                // webUrl,
                "web",
                false,
                skipCache
            )
        );
    }
    const manifestResult = await Promise.all(allAppManifests);

    return manifestResult;
}
