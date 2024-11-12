export interface AllowedAppsListData {
  Id: number;
  date: string;
  EntryPointUrl: string;
  expires: string;
  Title?: string;
}

export interface AllowedAppsListDataCache {
  data: AllowedAppsListData[];
  expires: string;
}
