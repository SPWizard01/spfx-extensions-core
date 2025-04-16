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
import type { SPFxExtensionAppDefinitionMapItem } from "../../../models/appFolderManifest";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../../models/AppFolderManifestDefinitionItem";
import type { ConfiguratorURLMapItem } from "../../models/urlMapItemExtended";
import {
  configurationIsGlobal,
  configurationRootWeb,
  configurationSite,
  configurationWebSubWebs,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
  selectedAppDeinitionMapItem,
  selectedAppItem,
} from "../../runtimeStore";

import { GetWebConfigContext } from "../../../utilities/getConfigWebContext";
import { Stack } from "../common/Stack";

interface IProps {
  appDefinitions: AppFolderManifestDefinitionItem[];
}

interface ConfiguratorURLMapItemWithSubSites extends ConfiguratorURLMapItem {
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
            hubid: configurationSite.data?.HubSiteId ?? "",
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
    return defaultList;
  });
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
  const hubRootCollections = urlsWithSubsites.filter((sc) => sc.isHubRoot);

  function GetBadge(
    color:
      | "subtle"
      | "success"
      | "brand"
      | "danger"
      | "important"
      | "informative"
      | "severe"
      | "warning"
      | undefined,
    text: string,
    width: string = "72px"
  ) {
    return (
      <Badge size="small" color={color} style={{ width: width }}>
        {text}
      </Badge>
    );
  }

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

            <Stack>
              <Subtitle2>Hub sites</Subtitle2>
              {hubRootCollections.map((site) => (
                <Stack>
                  <Stack
                    horizontal
                    gap={8}
                    verticalAlign="center"
                    horizontalAlign="space-between"
                  >
                    <Stack horizontal verticalAlign="center" gap={8}>
                      {GetBadge("success", "Hub")}
                      {site.url}
                    </Stack>
                    <Switch
                      onChange={(_, data) => {
                        //TODO
                        console.log(
                          "Turn on for ALL HUB SITE COLLECTION AND HUB CHILDS",
                          data
                        );
                      }}
                    />
                  </Stack>

                  <Stack
                    horizontal
                    gap={8}
                    verticalAlign="center"
                    horizontalAlign="space-between"
                  >
                    <Stack horizontal verticalAlign="center" gap={8}>
                      <ArrowTurnDownRightRegular />
                      {GetBadge("warning", "Site collection")}
                      {site.url}
                    </Stack>
                    <Switch
                      onChange={(_, data) => {
                        //TODO
                        console.log(
                          "Turn on for ALL SITE COLLECTION ROOT HUB",
                          data
                        );
                      }}
                    />
                  </Stack>

                  {site.webs.map((subSite) => (
                    <Stack
                      horizontal
                      horizontalAlign="space-between"
                      verticalAlign="center"
                      style={{ paddingLeft: "24px " }}
                    >
                      <Stack horizontal gap={8} verticalAlign="center">
                        <ArrowTurnDownRightRegular />
                        {GetBadge(undefined, "Web", "50px")}
                        <Body1>{subSite.url}</Body1>
                      </Stack>
                      <Switch />
                    </Stack>
                  ))}
                </Stack>
              ))}
            </Stack>

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

            <Stack gap={12}>
              <Subtitle2>Webs</Subtitle2>
              <Divider />
              {/* TODO List independent webs instead site collection */}
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
                      {/* TODO  */}
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
