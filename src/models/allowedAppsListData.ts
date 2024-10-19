export interface AllowedAppsListData {
  Id: number;
  date: string;
  expires: string;
  AppId?: string;
  FileName?: string;
  RelativeUrl?: string;
  Title?: string;
}

export interface AllowedAppsListDataCache {
  data: AllowedAppsListData[];
  expires: string;
}
