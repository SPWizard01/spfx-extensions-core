import {
  Badge,
  Body1,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Label,
  Link,
  MessageBar,
  MessageBarBody,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Subtitle2,
  Switch,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import {
  ArrowTurnDownRightRegular,
  Dismiss24Regular,
  Info16Regular,
} from "@fluentui/react-icons";
import { useComputed } from "@preact/signals";
import type { SPFxExtensionAppDefinitionMapItem } from "../../../../models/appFolderManifest";
import type { AppCollectionConfigurationItem } from "../../../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../../../models/AppFolderManifestDefinitionItem";
import type { ConfiguratorURLMapItem } from "../../../models/urlMapItemExtended";
import {
  configurationIsGlobal,
  configurationRootWeb,
  configurationSite,
  configurationWebSubWebs,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
  selectedAppDeinitionMapItem,
  selectedAppItem,
} from "../../../runtimeStore";

import { EMPTY_GUID } from "../../../../utilities/constants";
import { GetWebConfigContext } from "../../../../utilities/getConfigWebContext";
import { Stack } from "../../common/Stack";
import { GetBadge } from "./SitesDrawerBodyItems/Badges";
import HubSites from "./SitesDrawerBodyItems/HubSites";

interface IProps {
  appDefinitions: AppFolderManifestDefinitionItem[];
}

interface ConfiguratorURLMapItemWithSubSites extends ConfiguratorURLMapItem {
  webs: ConfiguratorURLMapItem[];
}

export interface UrlSiteCollection extends ConfiguratorURLMapItem {
  webs: ConfiguratorURLMapItem[];
}
export interface UrlHubCollection extends ConfiguratorURLMapItem {
  sites: UrlSiteCollection[];
  webs: ConfiguratorURLMapItem[];
}

const configWebContext = GetWebConfigContext();
export function ManageAppDefinitionMapItemDrawer({ appDefinitions }: IProps) {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const urlList = useComputed(() => {
    const defaultList: ConfiguratorURLMapItem[] = !configurationIsGlobal
      ? configurationWebSubWebs.map((w) => {
          return {
            id: w.Id,
            siteId: w.Id,
            hubid: configurationSite.data?.HubSiteId ?? EMPTY_GUID,
            url: w.Url,
            isRootWeb: w.Id === configurationRootWeb.data?.Id,
            isHubRoot:
              w.Id === configurationRootWeb.data?.Id &&
              getConfigurationWebIsRootHub(),
            canDelete: false,
          };
        })
      : [];
    contextCollectionConfig.value.urlMap.forEach((item) => {
      // not in default list
      if (!defaultList.some((s) => s.id === item.id)) {
        defaultList.push({
          ...item,
          canDelete: true,
        });
      }
    });
    const allGroupedByHub = Object.groupBy(defaultList, (item) => item.hubid);
    const nonEmptyHubKeys = Object.keys(allGroupedByHub).filter(
      (k) => k && k !== EMPTY_GUID
    );
    const restItemKeys = Object.keys(allGroupedByHub).filter(
      (k) => !k || k === EMPTY_GUID
    );
    const allHubs: ConfiguratorURLMapItem[] = [];
    const allSites: ConfiguratorURLMapItem[] = [];
    const allWebs: ConfiguratorURLMapItem[] = [];
    for (const element of nonEmptyHubKeys) {
      const hubItems = allGroupedByHub[element];
      if (!hubItems) continue;
      allHubs.push(...groupSites(hubItems));
    }

    for (const element of restItemKeys) {
      const nonHubItems = allGroupedByHub[element];
      if (!nonHubItems) continue;
      const groupedBySite = Object.groupBy(nonHubItems, (item) => item.siteId);
      const siteKeys = Object.keys(groupedBySite);
      for (const site of siteKeys) {
        const siteItems = groupedBySite[site];
        if (!siteItems) continue;
        const rootWeb = siteItems.find((s) => s.isRootWeb);
        const nonRootWebs = siteItems
          .filter((s) => !s.isRootWeb)
          .sort((a, b) => a.url.localeCompare(b.url));
        if (rootWeb) {
          allSites.push(rootWeb);
          allSites.push(...nonRootWebs);
          //push to sites collection
        } else {
          allWebs.push(...nonRootWebs);
          //push to webs collection
        }
      }
    }

    console.log(
      "allHubs",
      Object.groupBy(allHubs, (item) => item.hubid)
    );
    console.log(
      "allSites",
      Object.groupBy(allSites, (item) => item.siteId)
    );
    console.log(
      "allWebs",
      Object.groupBy(allWebs, (item) => item.siteId)
    );
    return defaultList;
  });

  const testBench = useComputed(() => {
    const defaultList: ConfiguratorURLMapItem[] = !configurationIsGlobal
      ? configurationWebSubWebs.map((w) => {
          return {
            id: w.Id,
            siteId: w.Id,
            hubid: configurationSite.data?.HubSiteId ?? EMPTY_GUID,
            url: w.Url,
            isRootWeb: w.Id === configurationRootWeb.data?.Id,
            isHubRoot:
              w.Id === configurationRootWeb.data?.Id &&
              getConfigurationWebIsRootHub(),
            canDelete: false,
          };
        })
      : [];
    contextCollectionConfig.value.urlMap.forEach((item) => {
      // not in default list
      if (!defaultList.some((s) => s.id === item.id)) {
        defaultList.push({
          ...item,
          canDelete: true,
        });
      }
    });
    const allGroupedByHub = Object.groupBy(defaultList, (item) => item.hubid);
    const nonEmptyHubKeys = Object.keys(allGroupedByHub).filter(
      (k) => k && k !== EMPTY_GUID
    );
    const hubResults: UrlHubCollection[] = [];
    for (const hubId of nonEmptyHubKeys) {
      const hubItems = allGroupedByHub[hubId];
      if (!hubItems) continue;
      const copyItems = [...hubItems];
      const hubRootIdx = copyItems.findIndex((s) => s.isHubRoot);
      //if this hub group contains root hub
      if (hubRootIdx > -1) {
        const hubRoot = copyItems.splice(hubRootIdx, 1)[0];
        let inHubCollection = hubResults.find((h) => h.hubid === hubId);
        if (!inHubCollection) {
          inHubCollection = {
            ...hubRoot,
            sites: [
              {
                ...hubRoot,
                webs: [hubRoot],
              },
            ],
            webs: [],
          };
          hubResults.push(inHubCollection);
        }
        const hubSubWebsToPush: ConfiguratorURLMapItem[] = spliceWebs(
          copyItems,
          hubRoot.siteId
        );
        const rootSite = inHubCollection.sites.find((s) => s.id === hubRoot.id);
        if (rootSite) rootSite.webs.push(...hubSubWebsToPush);
        const hubSitesToPush: UrlSiteCollection[] = spliceSites(copyItems);
        inHubCollection.sites.push(...hubSitesToPush);
        inHubCollection.webs.push(...copyItems);
      } else {
        const inHubCollection: UrlHubCollection = {
          canDelete: true,
          hubid: hubId,
          id: hubId,
          isHubRoot: true,
          isRootWeb: true,
          siteId: hubId,
          url: hubId,
          sites: [],
          webs: [],
        };
        inHubCollection.sites.push(...spliceSites(copyItems));
        inHubCollection.webs.push(...copyItems);
        hubResults.push(inHubCollection);
      }
      console.log("remaining", copyItems);
    }
    console.log("hubResults", hubResults);

    return hubResults;
  });
  console.log("testBench", testBench.value);
  if (!selectedAppDeinitionMapItem.value || !selectedAppItem.value) return null;

  const urlsWithSubsites: ConfiguratorURLMapItemWithSubSites[] = [];

  urlList.value.forEach((url, _, arr) => {
    if (url.isRootWeb) {
      urlsWithSubsites.push({
        ...url,
        webs: [
          url,
          ...arr.filter((s) => s.siteId === url.siteId && s.id !== url.id),
        ],
      });
    }
    return url;
  });

  // TODO Group urlList.value by hubs, sites, webs
  const siteCollections = urlsWithSubsites.filter(
    (v) => v.isRootWeb && !v.isHubRoot
  );

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={!!selectedAppDeinitionMapItem.value}
      position="end"
      size="large"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => {
                selectedAppDeinitionMapItem.value = undefined;
              }}
            />
          }
        >
          Enable app on sites
        </DrawerHeaderTitle>
      </DrawerHeader>
      <Stack style={{ padding: "8px 24px", width: "100%" }} gap={8}>
        <MessageBar intent="info">
          <MessageBarBody>
            Choose sites where to enable app{" "}
            {appDefinitions.find(
              (a) => a.appId === selectedAppDeinitionMapItem.value?.appId
            )?.name ?? selectedAppDeinitionMapItem.value?.appId}
          </MessageBarBody>
        </MessageBar>
      </Stack>

      <DrawerBody>
        <Stack gap={16} style={{ padding: "8px 0px" }}>
          <Stack gap={4}>
            <Stack
              horizontal
              horizontalAlign="space-between"
              verticalAlign="center"
            >
              <Stack horizontal gap={8} verticalAlign="center">
                <Label>Enable everywhere</Label>
                <Popover withArrow>
                  <PopoverTrigger disableButtonEnhancement>
                    <Link>
                      <Info16Regular />
                    </Link>
                  </PopoverTrigger>
                  <PopoverSurface tabIndex={-1}>
                    <Body1>
                      {configWebContext === "global" &&
                        "Enables app for all listed and unlisted hubs and sites in tenant."}
                    </Body1>
                  </PopoverSurface>
                </Popover>
              </Stack>
              <Switch
                defaultChecked={
                  selectedAppDeinitionMapItem.value.config.enabledEverywhere
                }
              />
            </Stack>

            <HubSites hubSites={testBench.value} />

            <Stack gap={12}>
              <Subtitle2>Site collections</Subtitle2>
              <Divider />
              {siteCollections.map((site) => (
                <>
                  <Stack>
                    <Stack
                      horizontal
                      gap={8}
                      verticalAlign="center"
                      horizontalAlign="space-between"
                    >
                      <Stack horizontal verticalAlign="center" gap={8}>
                        {GetBadge("warning", "Site collection")}
                        {site.url}
                      </Stack>
                      {/* TODO Enable for all site collection subsites */}
                      <Switch />
                    </Stack>

                    {site.webs.map((subSite) => (
                      <Stack
                        horizontal
                        horizontalAlign="space-between"
                        verticalAlign="center"
                      >
                        <Stack horizontal gap={8} verticalAlign="center">
                          <ArrowTurnDownRightRegular />
                          <Badge size="small">Web</Badge>
                          <Body1>{subSite.url.split(site.url)[1] || "/"}</Body1>
                        </Stack>
                        {/* TODO include/exclude separate site */}
                        <Switch />
                      </Stack>
                    ))}
                  </Stack>
                  <Divider />
                </>
              ))}
            </Stack>
            <Divider />
            <Stack gap={12}>
              <Subtitle2>Webs</Subtitle2>
              <Divider />
              {siteCollections.map((site) => (
                <>
                  <Stack>
                    <Stack
                      horizontal
                      gap={8}
                      verticalAlign="center"
                      horizontalAlign="space-between"
                    >
                      <Stack horizontal verticalAlign="center" gap={8}>
                        {GetBadge("warning", "Site collection")}
                        {site.url}
                      </Stack>
                      <Switch />
                    </Stack>

                    {site.webs.map((subSite) => (
                      <Stack
                        horizontal
                        horizontalAlign="space-between"
                        verticalAlign="center"
                      >
                        <Stack horizontal gap={8} verticalAlign="center">
                          <ArrowTurnDownRightRegular />
                          <Badge size="small">Web</Badge>
                          <Body1>{subSite.url.split(site.url)[1] || "/"}</Body1>
                        </Stack>
                        <Switch />
                      </Stack>
                    ))}
                  </Stack>
                  <Divider />
                </>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </DrawerBody>
      <DrawerFooter>
        <Stack horizontal gap={8} horizontalAlign="center">
          <Button
            appearance="secondary"
            onClick={() => {
              selectedAppDeinitionMapItem.value = undefined;
            }}
          >
            Cancel
          </Button>

          <Button
            appearance="primary"
            onClick={async () => {
              const selectedAppCopy: AppCollectionConfigurationItem =
                JSON.parse(JSON.stringify(selectedAppItem.value));
              const selectedDefCopy: SPFxExtensionAppDefinitionMapItem =
                JSON.parse(JSON.stringify(selectedAppDeinitionMapItem.value));
              const defItem =
                selectedAppCopy.manifest.appDefinitionMap.findIndex(
                  (a) => a.appId === selectedAppDeinitionMapItem.value!.appId
                );
              if (defItem > 0) {
                selectedAppCopy.manifest.appDefinitionMap[defItem] =
                  selectedDefCopy;
              } else {
                selectedAppCopy.manifest.appDefinitionMap.push(selectedDefCopy);
              }
              selectedAppItem.value = selectedAppCopy;
              selectedAppDeinitionMapItem.value = undefined;
            }}
          >
            Save
          </Button>
        </Stack>
      </DrawerFooter>
    </Drawer>
  );
}
function spliceSites(copyItems: ConfiguratorURLMapItem[]) {
  const sitesToPush: UrlSiteCollection[] = [];
  let siteIdx = copyItems.findIndex((s) => s.isRootWeb);
  while (siteIdx > -1) {
    const siteItem = copyItems.splice(siteIdx, 1)[0];
    let inSiteCollection = sitesToPush.find((s) => s.id === siteItem.id);
    if (!inSiteCollection) {
      inSiteCollection = {
        ...siteItem,
        webs: [siteItem],
      };
      sitesToPush.push(inSiteCollection);
    }
    const websToPush: ConfiguratorURLMapItem[] = spliceWebs(
      copyItems,
      siteItem.siteId
    );
    inSiteCollection.webs.push(
      ...websToPush.sort((a, b) => a.url.localeCompare(b.url))
    );
    siteIdx = copyItems.findIndex((s) => s.isRootWeb);
  }
  return sitesToPush;
}

function spliceWebs(copyItems: ConfiguratorURLMapItem[], siteId: string) {
  const websToPush: ConfiguratorURLMapItem[] = [];
  let webIdx = copyItems.findIndex((s) => s.siteId === siteId);
  while (webIdx > -1) {
    const webItem = copyItems.splice(webIdx, 1)[0];
    websToPush.push(webItem);
    webIdx = copyItems.findIndex((s) => s.siteId === siteId);
  }
  return websToPush.sort((a, b) => a.url.localeCompare(b.url));
}

function groupSites(mapItems: ConfiguratorURLMapItem[]) {
  const returnSites: ConfiguratorURLMapItem[] = [];
  const groupedSites = Object.groupBy(mapItems, (item) => item.siteId);
  const siteKeys = Object.keys(groupedSites);
  for (const site of siteKeys) {
    const siteItems = groupedSites[site];
    if (!siteItems) continue;
    const rootWeb = siteItems.find((s) => s.isRootWeb);
    const nonRootWebs = siteItems
      .filter((s) => !s.isRootWeb)
      .sort((a, b) => a.url.localeCompare(b.url));
    if (rootWeb) {
      returnSites.push(rootWeb);
    }
    returnSites.push(...nonRootWebs);
  }
  return returnSites;
}
