export interface AppsItem {
  name: string;
  enabled: boolean;
  isInDebug: () => boolean;
}