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
import type { SPFxExtensionUrlMapItem } from "../../../models/appCollectionManifest";
import { cloneObject } from "../../../utilities/helpers";
import type { CollectionEventHubData } from "../../models/eventData";
import type {
  HubUrlCollectionItem,
  SiteUrlCollectionItem,
} from "../../models/StructureModels";
import {
  configurationIsGlobal,
  configurationWebSP,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
} from "../../runtimeStore";
import { updateAppCollectionConfig } from "../../services/appCollection";
import { getHubStructure } from "../../services/webInfoService";
import { getGlobalStructure } from "../../services/webStructureResolver";
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
  const [prevDefinition, setPrevDefinition] = useState(
    contextCollectionConfig.value
  );
  const [hubStructure, setHubStructure] = useState<HubUrlCollectionItem[]>([]);
  const [siteStructure, setSiteStructure] = useState<SiteUrlCollectionItem[]>(
    []
  );
  const [webStructure, setWebStructure] = useState<SPFxExtensionUrlMapItem[]>(
    []
  );

  useSignalEffect(() => {
    if (!contextCollectionConfig.value) return;
    if (!prevDefinition) {
      setPrevDefinition(contextCollectionConfig.value);
      return;
    }
    const copy = JSON.stringify(contextCollectionConfig.value);
    const current = JSON.stringify(prevDefinition);
    setPrevDefinition(contextCollectionConfig.value);
    setModified(copy !== current);
  });

  useSignalEffect(() => {
    if (!contextCollectionConfig.value) return;
    if (configurationIsGlobal) {
      const globalStructure = getGlobalStructure(
        contextCollectionConfig.value.urlMap
      );
      setHubStructure(globalStructure.hubs);
      setSiteStructure(globalStructure.sites);
      setWebStructure(globalStructure.webs);
      return;
    }
    if (!configurationIsGlobal && getConfigurationWebIsRootHub()) {
      getHubStructure(
        configurationWebSP,
        contextCollectionConfig.value.urlMap
      ).then((data) => {
        if (data) {
          setHubStructure([data]);
        }
      });
    }
  });

  function deleteItem(eventData: CollectionEventHubData) {
    if (!contextCollectionConfig.value) return;
    const copy = cloneObject(contextCollectionConfig.value);
    if (eventData.itemType === "hub") {
      copy.urlMap = copy.urlMap.filter(
        (item) => item.hubid !== eventData.item.hubid
      );
    }
    if (eventData.itemType === "site") {
      copy.urlMap = copy.urlMap.filter(
        (item) => item.siteId !== eventData.item.siteId
      );
    }
    if (eventData.itemType === "web") {
      copy.urlMap = copy.urlMap.filter((item) => item.id !== eventData.item.id);
    }

    contextCollectionConfig.value = copy;
  }

  async function updateCollection() {
    if (!contextCollectionConfig.value) return;
    setIsResolving(true);
    try {
      await updateAppCollectionConfig(
        configurationWebSP,
        contextCollectionConfig.value
      );
    } finally {
      setIsResolving(false);
      setModified(false);
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
            {hubStructure.length > 0 ? (
              <HubSites
                hubSites={hubStructure}
                control="delete"
                onDeleteClick={deleteItem}
              />
            ) : null}
            {siteStructure.length > 0 ? (
              <Stack gap={8}>
                <Subtitle2 style={{ marginBottom: "8px" }}>
                  Site collections
                </Subtitle2>
                <Stack gap={8}>
                  <Divider />
                  <SiteCollections
                    siteCollections={siteStructure}
                    control="delete"
                    onDeleteClick={deleteItem}
                  />
                </Stack>
              </Stack>
            ) : null}

            {webStructure.length > 0 ? (
              <Stack gap={8}>
                <Subtitle2 style={{ marginBottom: "8px" }}>Webs</Subtitle2>
                <Stack gap={8}>
                  <Divider />
                  <Webs
                    webs={webStructure}
                    control="delete"
                    onDeleteClick={deleteItem}
                  />
                </Stack>
              </Stack>
            ) : null}
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
