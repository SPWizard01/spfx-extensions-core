import type { SPFxExtensionAppInstance } from "../../models/appModel";
import { EXTENSION_APPS_FOLDER } from "../../utilities/constants";
import { getWebAbsoluteUrl } from "../services/contextService";
import { createExtensionsDocumentLibrary, getExtensionsDocumentLibrary } from "../services/documentLibraryService";
import { addFile, createSubFolder } from "../services/fileService";
import { getConfiguringWebUrl } from "./services/webConfiguratorService";

export function launch(instance: SPFxExtensionAppInstance) {
    console.log("Configurator App Launched", instance);
    const webToConfigure = getConfiguringWebUrl()
    if(webToConfigure){
       const a = getExtensionsDocumentLibrary(webToConfigure).then((lib) => {console.log(lib)});
    }
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