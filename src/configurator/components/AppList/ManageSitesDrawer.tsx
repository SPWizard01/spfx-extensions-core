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
import {
  ArrowTurnDownRightRegular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
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
                ManageSitesDrawerSignal.value = false;
              }}
            />
          }
        >
          Manage sites
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <>
          <AddSite />
          <Stack gap={12}>
            {hubStructure.length > 0 ? (
              <>
                <Subtitle2>Hub sites</Subtitle2>
                <Divider />
                <Stack>
                  <HubSites
                    hubSites={hubStructure}
                    control="delete"
                    onDeleteClick={deleteItem}
                  />
                </Stack>
              </>
            ) : null}
            {siteStructure.length > 0 ? (
              <>
                <Subtitle2>Site collections</Subtitle2>
                <Divider />
                <Stack>
                  <SiteCollections
                    siteCollections={siteStructure}
                    control="delete"
                    additionalIcon={<ArrowTurnDownRightRegular />}
                    onDeleteClick={deleteItem}
                  />
                </Stack>
              </>
            ) : null}
            {webStructure.length > 0 ? (
              <>
                <Subtitle2>Webs</Subtitle2>
                <Divider />
                <Stack>
                  <Webs
                    webs={webStructure}
                    control="delete"
                    onDeleteClick={deleteItem}
                  />
                </Stack>
              </>
            ) : null}
          </Stack>
        </>
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
