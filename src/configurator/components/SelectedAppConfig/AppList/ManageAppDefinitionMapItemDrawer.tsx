import {
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
import type { SPFxExtensionUrlMapItem } from "../../../../models/appCollectionManifest";
import { GetWebConfigContext } from "../../../../utilities/getConfigWebContext";
import type { CollectionEventSiteData } from "../../../models/eventData";
import type {
  HubUrlCollectionItem,
  SiteUrlCollectionItem,
} from "../../../models/UrlCollectionMapItem";
import {
  getHubStructure,
  getSiteStructure,
} from "../../../services/webInfoService";
import { HubSites } from "../../common/HubSites";
import { SiteCollections } from "../../common/SiteCollections";
import { Stack } from "../../common/Stack";
import { Webs } from "../../common/Webs";

interface IProps {
  appDefinitions: AppFolderManifestDefinitionItem[];
}
const configWebContext = GetWebConfigContext();
export function ManageAppDefinitionMapItemDrawer({ appDefinitions }: IProps) {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [hubStructure, setHubStructure] = useState<HubUrlCollectionItem[]>([]);
  const [siteStructure, setSiteStructure] = useState<SiteUrlCollectionItem>();
  const [webStructure, setWebStructure] = useState<SPFxExtensionUrlMapItem[]>(
    []
  );
  useSignalEffect(() => {
    if (!configurationIsGlobal && getConfigurationWebIsRootHub()) {
      getHubStructure(
        configurationWebSP,
        contextCollectionConfig.value.urlMap
      ).then((hub) => {
        setHubStructure(hub ? [hub] : []);
      });
    }
    if (getConfigurationWebIsSite() && !getConfigurationWebIsRootHub()) {
      getSiteStructure(configurationWebSP).then((site) => {
        setSiteStructure(site);
      });
    }
  });

  async function updateMinfestFromSite(data: CollectionEventSiteData) {
    console.log("updateMinfestFromSite", data);
    if (data.controlType === "switch" && data.itemType === "site") {
      const siteItem = data.item;
      if (data.data) {
        const filterOutWebsOrSites =
          selectedAppDeinitionMapItem.value!.config.excludedIds.filter((a) =>
            siteItem.webs.some((w) => w.id !== a) ||
            siteItem.id !== a
          );
        const copy: SPFxExtensionAppDefinitionMapItem = JSON.parse(JSON.stringify(selectedAppDeinitionMapItem.value));
        copy.config.excludedIds = filterOutWebsOrSites;
        selectedAppDeinitionMapItem.value = copy;
      }
    }
  }

  if (!selectedAppDeinitionMapItem.value || !selectedAppItem.value) return null;

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
              {hubStructure.length > 0 ? (
                <HubSites hubSites={hubStructure} control="switch" />
              ) : null}
              {siteStructure ? (
                <>
                  <Subtitle2 style={{ marginBottom: "8px" }}>
                    Site collections
                  </Subtitle2>
                  <Stack gap={8}>
                    <Divider />
                    <SiteCollections
                      siteCollections={[siteStructure]}
                      control="switch"
                      onControlClick={updateMinfestFromSite}
                    />
                  </Stack>
                </>
              ) : null}
              {webStructure.length > 0 ? (
                <Stack gap={8}>
                  <Subtitle2 style={{ marginBottom: "8px" }}>Webs</Subtitle2>
                  <Stack gap={8}>
                    <Divider />
                    <Webs webs={webStructure} control="switch" />
                  </Stack>
                </Stack>
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
