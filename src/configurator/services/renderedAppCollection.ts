import type { SPFI } from "@pnp/sp";
import { fixupManifest } from "../../core/utility/helpers";
import type { SPFxExtensionFolderManifest } from "../../models/appFolderManifest";
import { MANIFEST_NAME, SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import { getEmptyAppItem } from "../runtimeStore";

export async function getAllAppItems(
  sp: SPFI,
  allAppCollections: string[],
  enabledAppCollections: string[]
) {
  const allAppsItems: AppCollectionConfigurationItem[] = [];
  const [batchedWeb, execute] = sp.web.batched();
  for (const appCollection of allAppCollections) {
    batchedWeb
      .getFileByUrl(`${SPFX_EXTENSIONS_FOLDER}/${appCollection}/${MANIFEST_NAME}`)
      .getText()
      .then((blob) => {
        const empty = getEmptyAppItem(appCollection);
        try {
          const manifest = JSON.parse(blob) as SPFxExtensionFolderManifest;
          fixupManifest(manifest);
          empty.manifest = manifest;
          empty.activated = enabledAppCollections.includes(appCollection);
          allAppsItems.push(empty);
        } catch {
          allAppsItems.push(empty);
        }
      })
      .catch(() => {
        allAppsItems.push(getEmptyAppItem(appCollection));
      });
  }
  await execute();
  return allAppsItems;
}
