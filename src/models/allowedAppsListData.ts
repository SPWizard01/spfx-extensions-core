import type { CacheItemBase } from "./cache";

export interface AllowedAppsListData extends CacheItemBase {
  Id: number;
  EntryPointUrl: string;
  Title?: string;
}
