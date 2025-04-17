export interface HubResultResponse {
  '@odata.context': string;
  value: HubResultSitesResponse[];
  '@odata.nextLink': string;
}

export interface HubResultSitesResponse {
  id: string;
  webUrl: string;
  title: string;
  sharepointIds: SharepointIds;
  siteCollection: SiteCollection;
  template: Template;
  exchangeIds: ExchangeIds;
  resourceVisualization: ResourceVisualization;
}

interface ResourceVisualization {
  acronym: string;
  color: string;
}

interface ExchangeIds {
  id: string;
  documentId: string;
}

interface Template {
  name: string;
}

interface SiteCollection {
  hostName: string;
}

interface SharepointIds {
  hubSiteId: string;
  siteId: string;
  siteUrl: string;
  webId: string;
}