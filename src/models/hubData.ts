import type { CacheItemBase } from "./cache";

export interface HubData extends CacheItemBase {
    EnablePermissionsSync: boolean;
    EnforcedECTsVersion: number;
    HideNameInNavigation: boolean;
    ID: string;
    LogoUrl: string;
    ParentHubSiteId: string;
    PermissionsSyncTag: number;
    RequiresJoinApproval: boolean;
    SiteDesignId: string;
    SiteId: string;
    SiteUrl: string;
    Targets: string;
    TenantInstanceId: string;
    Title: string;
  }