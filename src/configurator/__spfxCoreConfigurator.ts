import "@pnp/sp/webs";
import type { IWebInfo } from "@pnp/sp/webs";
import { getWebAbsoluteUrl } from "../core/services/contextService";
import { createSubFolder } from "../core/services/fileService";
import type { SPFxExtensionAppInstance } from "../models/appModel";
import { EXTENSION_APPS_FOLDER } from "../utilities/constants";
import { ensurAppsTxt, ensureManifestTxt } from "./services/fileService";
import { ensureSPFxExtensionsAppFolder, getSPFxExtensionApps } from "./services/folderService";
import { getPnPSP } from "./services/pnpService";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";
export async function launch(instance: SPFxExtensionAppInstance) {
    console.log("Configurator App Launched", instance);
    const webToConfigure = getConfiguringWebUrl()
    if (webToConfigure) {

    }
    const sp = getPnPSP("https://8s2kdn.sharepoint.com/sites/CommunicationNoDeletePolicy");
    sp.web().then((c: IWebInfo)=>{
        console.log("Web Info", c)
    })
    const apps = await getSPFxExtensionApps(sp);
    console.log("Apps", apps);
    if (instance.element) {
        const btn = document.createElement("button");
        btn.innerHTML = "Click Me";
        btn.onclick = () => {
            createSubFolder(getWebAbsoluteUrl(), EXTENSION_APPS_FOLDER, "sample/ggs")
        }
        instance.element.appendChild(btn);
    }
    return () => {

    }
}