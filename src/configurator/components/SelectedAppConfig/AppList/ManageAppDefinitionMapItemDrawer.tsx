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
import { useSignalEffect } from "@preact/signals";
import type { SPFxExtensionAppDefinitionMapItem } from "../../../../models/appFolderManifest";
import type { AppCollectionConfigurationItem } from "../../../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../../../models/AppFolderManifestDefinitionItem";
import type { ConfiguratorURLMapItem } from "../../../models/urlMapItemExtended";
import {
  configurationIsGlobal,
  configurationWebSP,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
  getConfigurationWebIsSite,
  selectedAppDeinitionMapItem,
  selectedAppItem,
} from "../../../runtimeStore";

import { useState } from "preact/hooks";
import { GetWebConfigContext } from "../../../../utilities/getConfigWebContext";
import type { HubUrlCollectionItem } from "../../../models/UrlCollectionMapItem";
import { getHubStructure } from "../../../services/webInfoService";
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
  console.log(configWebContext);

  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [hubStructure, setHubStructure] = useState<HubUrlCollectionItem[]>([]);
  useSignalEffect(() => {
    if (!configurationIsGlobal && getConfigurationWebIsRootHub()) {
      getHubStructure(
        configurationWebSP,
        contextCollectionConfig.value.urlMap
      ).then((hub) => {
        setHubStructure(hub ? [hub] : []);
      });
    }
  });

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
              {configWebContext === "global" ||
                (configWebContext === "hubRoot" && (
                  <HubSites hubSites={hubStructure} />
                ))}
              {configWebContext === "nonHub" && (
                <SiteCollections siteCollections={siteCollections} />
              )}
              {configWebContext === "global" ||
                configWebContext === "subsite" ||
                (configWebContext === "hubChild" && (
                  <Webs webs={siteCollections} />
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
