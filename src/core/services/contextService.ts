import { EMPTY_GUID } from "../../utilities/constants";
import { extractGUIDFromString } from "../../utilities/helpers";

export function getWebId() {
  return window.__SPFxExtensions.__CurrentContext.contextType === "SPOModernContext"
    ? (window.__SPFxExtensions.__CurrentContext.context.web.id.toString() as string)
    : extractGUIDFromString(window.__SPFxExtensions.__CurrentContext.context.webId);
}

export function getWebAbsoluteUrl() {
  const absoluteUrl = (
    window.__SPFxExtensions.__CurrentContext.contextType === "SPOModernContext"
      ? (window.__SPFxExtensions.__CurrentContext.context.web.absoluteUrl as string)
      : window.__SPFxExtensions.__CurrentContext.context.webAbsoluteUrl
  ) as string;
  return absoluteUrl.replace(/\/$/, "");
}

export function getSiteId() {
  return window.__SPFxExtensions.__CurrentContext.contextType === "SPOModernContext"
    ? (window.__SPFxExtensions.__CurrentContext.context.site.id.toString() as string)
    : extractGUIDFromString(window.__SPFxExtensions.__CurrentContext.context.siteId);
}

export function getSiteAbsoluteUrl() {
  return window.__SPFxExtensions.__CurrentContext.contextType === "SPOModernContext"
    ? (window.__SPFxExtensions.__CurrentContext.context.site.absoluteUrl as string)
    : window.__SPFxExtensions.__CurrentContext.context.siteAbsoluteUrl;
}

export function getHubSiteId() {
  return (
    (window.__SPFxExtensions.__CurrentContext.contextType === "SPOModernContext"
      ? (window.__SPFxExtensions.__CurrentContext.context.legacyPageContext.hubSiteId?.toString() as string)
      : window.__SPFxExtensions.__CurrentContext.context.hubSiteId) ?? EMPTY_GUID
  );
}

export function getIsHubSite() {
  return window.__SPFxExtensions.__CurrentContext.contextType === "SPOModernContext"
    ? (window.__SPFxExtensions.__CurrentContext.context.legacyPageContext.isHubSite as boolean)
    : window.__SPFxExtensions.__CurrentContext.context.isHubSite;
}

export function getIsRootWeb() {
  return getSiteAbsoluteUrl() === getWebAbsoluteUrl();
}
