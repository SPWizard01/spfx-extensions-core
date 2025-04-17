import {
  Body1,
  Button,
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
  Switch,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import { Dismiss24Regular, Info16Regular } from "@fluentui/react-icons";
import { useComputed } from "@preact/signals";
import type { SPFxExtensionAppDefinitionMapItem } from "../../../../models/appFolderManifest";
import type { AppCollectionConfigurationItem } from "../../../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../../../models/AppFolderManifestDefinitionItem";
import type { ConfiguratorURLMapItem } from "../../../models/urlMapItemExtended";
import {
  configurationHubStructure,
  configurationIsGlobal,
  configurationRootWeb,
  configurationSite,
  configurationSiteStructure,
  configurationWebSubWebs,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
  getConfigurationWebIsSite,
  getConfigurationWebIsSubsite,
  selectedAppDeinitionMapItem,
  selectedAppItem,
} from "../../../runtimeStore";

import type { SPFxExtensionUrlMapItem } from "../../../../models/appCollectionManifest";
import { EMPTY_GUID } from "../../../../utilities/constants";
import { GetWebConfigContext } from "../../../../utilities/getConfigWebContext";
import type {
  HubUrlCollectionItem,
  SiteUrlCollectionItem,
} from "../../../models/UrlCollectionMapItem";
import {
  spliceSites,
  spliceWebs,
} from "../../../services/webStructureResolver";
import { Stack } from "../../common/Stack";
import HubSites from "./SitesDrawerBodyItems/HubSites";
import SiteCollections from "./SitesDrawerBodyItems/SiteCollections";
import Webs from "./SitesDrawerBodyItems/Webs";

interface IProps {
  appDefinitions: AppFolderManifestDefinitionItem[];
}

interface ConfiguratorURLMapItemWithSubSites extends ConfiguratorURLMapItem {
  webs: ConfiguratorURLMapItem[];
}

const configWebContext = GetWebConfigContext();
export function ManageAppDefinitionMapItemDrawer({ appDefinitions }: IProps) {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const _urlList = useComputed(() => {
    const hubToMap = configurationHubStructure;
    const siteToMap = configurationSiteStructure;
    const defaultList: ConfiguratorURLMapItem[] =
      !configurationIsGlobal && getConfigurationWebIsSite()
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
    if (configurationIsGlobal) {
      contextCollectionConfig.value.urlMap.forEach((item) => {
        // not in default list
        if (!defaultList.some((s) => s.id === item.id)) {
          defaultList.push({
            ...item,
            canDelete: true,
          });
        }
      });
    }

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
    const hubResults: HubUrlCollectionItem[] = [];
    for (const hubId of nonEmptyHubKeys) {
      const hubItems = allGroupedByHub[hubId];
      if (!hubItems) continue;
      const remainingItems = [...hubItems];
      const hubRootIdx = remainingItems.findIndex((s) => s.isHubRoot);
      //if this hub group contains root hub
      if (hubRootIdx > -1) {
        const hubRoot = remainingItems.splice(hubRootIdx, 1)[0];
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
        console.log("hubSubWebsToPush", remainingItems, hubRoot.siteId);
        const hubSubWebsToPush: SPFxExtensionUrlMapItem[] = spliceWebs(
          remainingItems,
          hubRoot.siteId
        );
        const rootSite = inHubCollection.sites.find((s) => s.id === hubRoot.id);
        if (rootSite) rootSite.webs.push(...hubSubWebsToPush);
        const hubSitesToPush: SiteUrlCollectionItem[] =
          spliceSites(remainingItems);
        inHubCollection.sites.push(...hubSitesToPush);
        inHubCollection.webs.push(...remainingItems);
      } else {
        const inHubCollection: HubUrlCollectionItem = {
          hubid: hubId,
          id: hubId,
          isHubRoot: true,
          isRootWeb: true,
          siteId: hubId,
          url: hubId,
          sites: [],
          webs: [],
        };
        inHubCollection.sites.push(...spliceSites(remainingItems));
        inHubCollection.webs.push(...remainingItems);
        hubResults.push(inHubCollection);
      }
      console.log("remaining", remainingItems);
    }
    console.log("hubResults", hubResults);

    return hubResults;
  });
  console.log("testBench", testBench.value);
  if (!selectedAppDeinitionMapItem.value || !selectedAppItem.value) return null;

  const urlsWithSubsites: ConfiguratorURLMapItemWithSubSites[] = [];

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
            <Stack gap={12}>
              {getConfigurationWebIsRootHub() || configurationIsGlobal ? (
                <HubSites
                  hubSites={
                    configurationHubStructure ? [configurationHubStructure] : []
                  }
                />
              ) : null}
              {configurationIsGlobal ? (
                <SiteCollections siteCollections={siteCollections} />
              ) : null}
              {(getConfigurationWebIsSite() || configurationIsGlobal) &&
              !getConfigurationWebIsRootHub() ? (
                <Webs webs={siteCollections} />
              ) : null}
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
