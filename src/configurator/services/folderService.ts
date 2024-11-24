import type { SPFI } from "@pnp/sp";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
const listDescription = "This folder contains extensions that are loaded by the SPFxExtensions application.";

export function ensureSPFxExtensionsFolder(sp: SPFI) {
    return sp.web.lists.ensure(SPFX_EXTENSIONS_FOLDER, listDescription, 101, false, { Hidden: true })
}

