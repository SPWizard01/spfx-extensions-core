import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Subtitle2,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { signal, useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import type {
  SPFxExtensionCollectionManifest,
  SPFxExtensionUrlMapItem,
} from "../../../models/appCollectionManifest";
import type { ConfiguratorURLMapItem } from "../../models/urlMapItemExtended";
import {
  configurationIsGlobal,
  configurationRootWeb,
  configurationSite,
  configurationWebSP,
  configurationWebSubWebs,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
} from "../../runtimeStore";
import { updateAppCollectionConfig } from "../../services/appCollection";
import { HubSites } from "../common/HubSites";
import { SiteCollections } from "../common/SiteCollections";
import { Stack } from "../common/Stack";
import { Webs } from "../common/Webs";
import { AddSite } from "./AddSite";

export const ManageSitesDrawerSignal = signal(false);

export function ManageSitesDrawer() {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [isResolving, setIsResolving] = useState(false);
  const [modified, setModified] = useState(false);
  const [collectionUrlMap, setCollectionUrlMap] = useState<
    ConfiguratorURLMapItem[]
  >([]);

  useSignalEffect(() => {
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
    setCollectionUrlMap(defaultList);
  });

  function _deleteSite(web: SPFxExtensionUrlMapItem) {
    const collectionCopy: ConfiguratorURLMapItem[] = JSON.parse(
      JSON.stringify(collectionUrlMap)
    );

    const itemIndex = collectionCopy.findIndex((s) => s.id === web.id);

    if (itemIndex < 0) {
      return;
    }
    collectionCopy.splice(itemIndex, 1);
    setModified(true);
    setCollectionUrlMap(collectionCopy);
  }

  async function updateCollection() {
    setIsResolving(true);
    const contextCopy: SPFxExtensionCollectionManifest = JSON.parse(
      JSON.stringify(contextCollectionConfig.value)
    );
    try {
      contextCopy.urlMap = collectionUrlMap.map((item) => {
        return {
          id: item.id,
          siteId: item.siteId,
          hubid: item.hubid,
          url: item.url,
          isRootWeb: item.isRootWeb,
          isHubRoot: item.isHubRoot,
        };
      });
      await updateAppCollectionConfig(configurationWebSP, contextCopy);
      contextCollectionConfig.value = contextCopy;
    } finally {
      setIsResolving(false);
      setModified(false);
      setCollectionUrlMap([]);
      ManageSitesDrawerSignal.value = false;
    }
  }

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={ManageSitesDrawerSignal.value}
      onOpenChange={() => {}}
      position="end"
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => {
                ManageSitesDrawerSignal.value = false;
              }}
            />
          }
        >
          Manage sites
        </DrawerHeaderTitle>
      </DrawerHeader>
      <AddSite />
      <DrawerBody>
        <Stack gap={16} style={{ padding: "8px 0px" }}>
          <Stack gap={4}>
            <HubSites hubSites={[]} control="delete" />
            <Stack gap={8}>
              <Subtitle2 style={{ marginBottom: "8px" }}>
                Site collections
              </Subtitle2>
              <Stack gap={8}>
                <Divider />
                <SiteCollections siteCollections={[]} control="delete" />
              </Stack>
            </Stack>
            <Stack gap={8}>
              <Subtitle2 style={{ marginBottom: "8px" }}>Webs</Subtitle2>
              <Stack gap={8}>
                <Divider />
                <Webs webs={[]} control="delete" />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </DrawerBody>
      <DrawerFooter>
        <Stack horizontal gap={8} horizontalAlign="center">
          <Button
            appearance="secondary"
            onClick={() => {
              ManageSitesDrawerSignal.value = false;
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!modified || isResolving}
            appearance="primary"
            onClick={() => {
              updateCollection();
            }}
          >
            Save
          </Button>
        </Stack>
      </DrawerFooter>
    </Drawer>
  );
}
