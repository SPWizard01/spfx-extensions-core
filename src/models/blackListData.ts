export interface BlackListData {
  BlockedAppId: string;
  BlockedFileName: string;
  RelativeUrl: string;
  Title: string;
}

export interface BlackListDataCache {
  data: BlackListData[];
  expires: string;
}
