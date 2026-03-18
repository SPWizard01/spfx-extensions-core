export function getConfiguringWebUrl() {
    const webUrl = new URL(window.location.href).searchParams.get("web");
    return webUrl ?? "";
}