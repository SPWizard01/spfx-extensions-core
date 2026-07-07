import type { SPFI } from "@pnp/sp";
import "@pnp/sp/items";
import "@pnp/sp/lists";
import { logGenericCoreError } from "../../core/services/loggingService";
import { getDefaultSettings } from "../../core/utility/defaultConfig";
import type { ConfigurationListBaseData } from "../../models/configurationList";
import { CONFIGURATION_LIST_NAME } from "../../utilities/constants";

export interface GlobalSettingItem extends ConfigurationListBaseData {
  /** SharePoint list item id, present only for settings already persisted in the list. */
  Id?: number;
}

/**
 * Reads the raw persisted settings from the `SPFxExtensionsConfiguration` list.
 */
export async function getGlobalSettingsItems(sp: SPFI): Promise<GlobalSettingItem[]> {
  const items = await sp.web.lists
    .getByTitle(CONFIGURATION_LIST_NAME)
    .items.select("Id", "Title", "Data")();
  return items.map((item) => ({ Id: item.Id, Title: item.Title, Data: item.Data }));
}

/**
 * Effective settings = the complete default set overlaid by whatever is persisted in the
 * list, so every known setting is present. Carries the list item `Id` when it exists (so
 * edits update the item rather than create a duplicate). Falls back to defaults when the
 * list cannot be read.
 */
export async function getEffectiveSettings(
  sp: SPFI,
  rootDefaultUrl: string
): Promise<GlobalSettingItem[]> {
  let persisted: GlobalSettingItem[] = [];
  try {
    persisted = await getGlobalSettingsItems(sp);
  } catch (err) {
    logGenericCoreError("Unable to read global settings list; showing defaults.", err);
  }
  const byTitle = new Map<ConfigurationListBaseData["Title"], GlobalSettingItem>();
  for (const def of getDefaultSettings(rootDefaultUrl)) {
    byTitle.set(def.Title, { Title: def.Title, Data: def.Data });
  }
  for (const item of persisted) {
    byTitle.set(item.Title, item);
  }
  return [...byTitle.values()];
}

/**
 * Persists a single setting: updates the existing list item when `id` is known, otherwise
 * adds a new one (this is how a previously-defaulted setting first gets written).
 */
export async function upsertSetting(
  sp: SPFI,
  title: ConfigurationListBaseData["Title"],
  data: string,
  id?: number
) {
  const list = sp.web.lists.getByTitle(CONFIGURATION_LIST_NAME);
  if (id) {
    await list.items.getById(id).update({ Data: data });
  } else {
    await list.items.add({ Title: title, Data: data });
  }
}
