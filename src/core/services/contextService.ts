import { getContextInfoAsync } from "../../services/spContextService";
import { EMPTY_GUID } from "../../utilities/constants";
import { extractGUIDFromString } from "../../utilities/helpers";

const initialContext = await getContextInfoAsync();

export function getWebId(): string {
    return initialContext.contextType === "SPOModernContext" ? initialContext.context.web.id.toString() : extractGUIDFromString(initialContext.context.webId)
}

export function getWebAbsoluteUrl() {
    return (initialContext.contextType === "SPOModernContext" ? initialContext.context.web.absoluteUrl : initialContext.context.webAbsoluteUrl) as string;
}

export function getSiteId() {
    return initialContext.contextType === "SPOModernContext" ? (initialContext.context.site.id.toString() as string) : extractGUIDFromString(initialContext.context.siteId)
}

export function getSiteAbsoluteUrl(): string {
    return initialContext.contextType === "SPOModernContext" ? initialContext.context.site.absoluteUrl : initialContext.context.siteAbsoluteUrl;
}

export function getHubSiteId(): string {
    return (initialContext.contextType === "SPOModernContext" ? initialContext.context.legacyPageContext.hubSiteId?.toString() : initialContext.context.hubSiteId) ?? EMPTY_GUID;
}

export function getIsHubSite() {
    return initialContext.contextType === "SPOModernContext" ? initialContext.context.legacyPageContext.isHubSite : (initialContext.context as any).isHubSite;
}

export function getIsRootWeb() {
    return getSiteAbsoluteUrl() === getWebAbsoluteUrl();
}