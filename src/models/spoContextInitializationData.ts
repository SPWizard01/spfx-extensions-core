export interface SPOContextInitializationData {
    aadInfo: AadInfo;
    cultureInfo: CultureInfo;
    list: List;
    listItem: ListItem;
    page: Page;
    site: Site;
    user: User;
    web: Web;
    featureInfo: FeatureInfo;
}

export interface SPOPageContext {
    _initializationData: SPOContextInitializationData,
    initialize(initData: SPOContextInitializationData, legacyPageContext: typeof window._spPageContextInfo): void;
    [key: string]: any;
  }

interface FeatureInfo {
  SitePages: FeatureInfoDetails;
  SitePagesResources: FeatureInfoDetails;
  RecommendedItems: FeatureInfoDetails;
  MultilingualPages: FeatureInfoDetails;
  MultilingualResources: FeatureInfoDetails;
  Viewers: FeatureInfoDetails;
  SitePagePublishing: FeatureInfoDetails;
  SitePagesScheduling: FeatureInfoDetails;
  SitePagesSchedulingResources: FeatureInfoDetails;
  ModernAudienceTargeting: FeatureInfoDetails;
  FeedVideo: FeatureInfoDetails;
  FeedVideoResources: FeatureInfoDetails;
  Publishing: FeatureInfoDetails;
  FollowingContent: FeatureInfoDetails;
  CategoriesPages: FeatureInfoDetails;
  ContentCenterFeature: FeatureInfoDetails;
  ContentCenterEverywhereFeature: FeatureInfoDetails;
  MixedReality: FeatureInfoDetails;
  MixedRealityResources: FeatureInfoDetails;
  EEDashboard: FeatureInfoDetails;
  VivaBackendFeature: FeatureInfoDetails;
  Announcement: FeatureInfoDetails;
  FlwPropertyFiltering: FeatureInfoDetails;
}

interface FeatureInfoDetails {
  Version: number;
  Enabled: boolean;
}

interface Web {
  absoluteUrl: string;
  id: string;
  isAppWeb: boolean;
  language: number;
  languageName: string;
  logoUrl: string;
  permissions: Permissions;
  serverRelativeUrl: string;
  templateName: string;
  description: string;
  timeZoneInfo: TimeZoneInfo;
  title: string;
}

interface TimeZoneInfo {
  daylightDate: DaylightDate;
  daylightOffset: number;
  description: string;
  id: number;
  offset: number;
  standardDate: DaylightDate;
  standardOffset: number;
}

interface DaylightDate {
  Year: number;
  Month: number;
  DayOfWeek: number;
  Day: number;
  Hour: number;
  Minute: number;
  Second: number;
  Milliseconds: number;
}

interface User {
  isAnonymousGuestUser: boolean;
  isExternalGuestUser: boolean;
  displayName: string;
  email: string;
  loginName: string;
  preferUserTimeZone: boolean;
}

interface Site {
  absoluteUrl: string;
  cdnPrefix: string;
  classification: string;
  correlationId: string;
  id: string;
  isNoScriptEnabled: boolean;
  recycleBinItemCount: number;
  serverRelativeUrl: string;
  serverRequestPath: string;
  sitePagesEnabled: boolean;
  sitePagesFeatureVersion: number;
}

interface Page {
  socialBarEnabled: boolean;
}

interface ListItem {
  id: number;
  uniqueId: string;
}

interface List {
  baseTemplate: number;
  id: string;
  permissions: Permissions;
  serverRelativeUrl: string;
  title: string;
}

interface Permissions {
  High: number;
  Low: number;
}

interface CultureInfo {
  currentCultureName: string;
  currentUICultureName: string;
  isRightToLeft: boolean;
}

interface AadInfo {
  instanceUrl: string;
  tenantId: string;
  userId: string;
}