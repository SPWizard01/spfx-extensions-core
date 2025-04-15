import type { SPFxExtensionCollectionManifest } from "../../models/appCollectionManifest";
import type { CacheableAppCollectionManifest, ManifestLocation } from "../../models/cache";
import { APPCOLLECTION_MANIFEST_NAME, EMPTY_COLLECTION_MANIFEST, SPFxExtensionCore, WELL_KNOWN_MANIFEST_LOCATION } from "../../utilities/constants";
import { isInDebug } from "../../utilities/debug";
import { getContentDigest } from "../../utilities/digest";
import { getRootCDNLocation } from "./coreConfigService";
import { getAppCollectionTXTFromCache, setOrUpdateAppCollectionTXT } from "./coreIdbService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreWarning } from "./loggingService";



function validateAppsTXT(manifest: SPFxExtensionCollectionManifest) {
    if (!Array.isArray(manifest.enabledAppCollections)) {
        throw `${SPFxExtensionCore} ${APPCOLLECTION_MANIFEST_NAME} enabledAppCollections should be an array`;
    }

    if (!Array.isArray(manifest.urlMap)) {
        throw `${SPFxExtensionCore} ${APPCOLLECTION_MANIFEST_NAME} urlMap should be an array`;
    }
}

async function fetchAndCacheAppsTXT(
    url: string,
    name: string,
    type: ManifestLocation,
    isHubFetch: boolean,
    skipCache = false,
    cacheTimeMinutes = 60
): Promise<CacheableAppCollectionManifest> {
    let appCollection = EMPTY_COLLECTION_MANIFEST;
    const fetchLocation = url.toLowerCase();
    if (!skipCache && !isInDebug) {
        const cachedManifest = await getAppCollectionTXTFromCache(fetchLocation);
        if (cachedManifest) {
            cachedManifest.isHubFetch = isHubFetch;
            return cachedManifest;
        }
    }
    const fetchUrl = `${fetchLocation}?v=${Date.now()}`;
    try {
        logGenericCoreDebug(`Fetching ${APPCOLLECTION_MANIFEST_NAME} from`, fetchUrl);
        const mnfReq = await fetch(fetchUrl);
        const result = await mnfReq.text();
        appCollection = JSON.parse(result);

    } catch (err) {
        logGenericCoreWarning(`Unable to fetch ${APPCOLLECTION_MANIFEST_NAME} from`, fetchUrl, err);
    }
    try {
        validateAppsTXT(appCollection);
    } catch (err) {
        logGenericCoreError(`Error while parsing ${APPCOLLECTION_MANIFEST_NAME} from`, fetchUrl, err);
        appCollection = EMPTY_COLLECTION_MANIFEST;
    }
    const hash = await getContentDigest(JSON.stringify(appCollection));
    const baseResult = {
        name,
        url: fetchLocation,
        type,
        hash,
    };

    const retResult: CacheableAppCollectionManifest = { manifest: appCollection, ...baseResult };
    await setOrUpdateAppCollectionTXT(retResult, isInDebug ? 1 : cacheTimeMinutes);
    //assign later so we dont save to cache.
    retResult.isHubFetch = isHubFetch;
    return retResult;
}

export async function fetchAppCollectionConfigFromAllLocations(
    siteUrl: string,
    webUrl: string,
    hubUrl: string,
    skipCache = false
): Promise<CacheableAppCollectionManifest[]> {
    // all collectionConfig.txt accross the context (root / site /web)
    const allAppManifests: Promise<CacheableAppCollectionManifest>[] = [];
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
