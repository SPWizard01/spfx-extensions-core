import { getContextInfoAsync } from "../../services/spContextService";
export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export const contextInfo = await getContextInfoAsync();

export function getWebId() {
    return contextInfo.contextType === "SPOModernContext" ? contextInfo.context.web.id.toString() : contextInfo.context.webId.replace("{", "").replace("}", "");
}

export function getWebAbsoluteUrl() {
    return (contextInfo.contextType === "SPOModernContext" ? contextInfo.context.web.absoluteUrl : contextInfo.context.webAbsoluteUrl) as string;
}

export function getSiteId() {
    return contextInfo.contextType === "SPOModernContext" ? contextInfo.context.site.id.toString() : contextInfo.context.site.replace("{", "").replace("}", "");
}

export function getSiteAbsoluteUrl() {
    return contextInfo.contextType === "SPOModernContext" ? contextInfo.context.site.absoluteUrl : contextInfo.context.siteAbsoluteUrl;
}

export function getHubSiteId() {
    return (contextInfo.contextType === "SPOModernContext" ? contextInfo.context.legacyPageContext.hubSiteId?.toString() : contextInfo.context.hubSiteId) ?? EMPTY_GUID;
}

export function currentSiteIsRootHub() {
    const hubId = getHubSiteId();
    return getSiteId().toLowerCase() === hubId.toLowerCase() || !hubId || hubId === EMPTY_GUID;
}