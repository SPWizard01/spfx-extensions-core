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
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Subtitle2,
  Switch,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import {
  ArrowRightRegular,
  ArrowTurnDownRightRegular,
  Dismiss24Regular,
  Info16Regular,
} from "@fluentui/react-icons";
import { useSignalEffect } from "@preact/signals";
import type { AppFolderManifestDefinitionItem } from "../../../models/AppFolderManifestDefinitionItem";
import {
  configurationIsGlobal,
  configurationWebSP,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
  getConfigurationWebIsSiteCollection,
  selectedAppDefinitionItem,
  selectedAppItem,
} from "../../../runtimeStore";

import { useState } from "preact/hooks";
import type { SPFxExtensionUrlMapItem } from "../../../../models/appCollectionManifest";
import { GetWebConfigContext } from "../../../../utilities/getConfigWebContext";
import { cloneObject } from "../../../../utilities/helpers";
import type {
  HubUrlCollectionItem,
  SiteUrlCollectionItem,
} from "../../../models/StructureModels";
import {
  getHubStructure,
  getSiteStructure,
} from "../../../services/webInfoService";
import { getGlobalStructure } from "../../../services/webStructureResolver";
import { HubSites } from "../../common/HubSites";
import { SiteCollections } from "../../common/SiteCollections";
import { Stack } from "../../common/Stack";
import { Webs } from "../../common/Webs";

interface IProps {
  appDefinitions: AppFolderManifestDefinitionItem[];
}
const configWebContext = GetWebConfigContext();
export function ManageAppDefinitionMapItemDrawer(_props: IProps) {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [prevDefinition, setPrevDefinition] = useState(
    selectedAppDefinitionItem.value
  );
  const [modified, setModified] = useState(false);
  const [hubStructure, setHubStructure] = useState<HubUrlCollectionItem[]>([]);
  const [siteStructure, setSiteStructure] = useState<SiteUrlCollectionItem[]>(
    []
  );
  const [webStructure, setWebStructure] = useState<SPFxExtensionUrlMapItem[]>(
    []
  );
  useSignalEffect(() => {
    if (!selectedAppDefinitionItem.value) return;
    if (!prevDefinition) {
      setPrevDefinition(selectedAppDefinitionItem.value);
      return;
    }
    const copy = JSON.stringify(selectedAppDefinitionItem.value);
    const current = JSON.stringify(prevDefinition);
    setPrevDefinition(selectedAppDefinitionItem.value);
    setModified(copy !== current);
  });

  useSignalEffect(() => {
    if (!configurationIsGlobal) {
      if (getConfigurationWebIsRootHub()) {
        getHubStructure(
          configurationWebSP,
          contextCollectionConfig.value.urlMap
        ).then((hub) => {
          setHubStructure(hub ? [hub] : []);
        });
      }
      if (
        getConfigurationWebIsSiteCollection() &&
        !getConfigurationWebIsRootHub()
      ) {
        getSiteStructure(configurationWebSP).then((site) => {
          setSiteStructure(site ? [site] : []);
        });
      }
    } else {
      const global = getGlobalStructure(contextCollectionConfig.value.urlMap);
      setHubStructure(global.hubs);
      setSiteStructure(global.sites);
      setWebStructure(global.webs);
    }
  });

  if (!selectedAppDefinitionItem.value || !selectedAppItem.value) return null;

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={!!selectedAppDefinitionItem.value}
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
                selectedAppDefinitionItem.value = undefined;
              }}
            />
          }
        >
          Enable app on sites
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <>
          <Stack
            horizontal
            horizontalAlign="space-between"
            verticalAlign="center"
          >
            <Stack horizontal verticalAlign="center" gap={8}>
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
                selectedAppDefinitionItem.value.config.enabledEverywhere
              }
              onChange={(_e, data) => {
                const copy = cloneObject(selectedAppDefinitionItem.value!);

                copy.config.enabledEverywhere = data.checked;
                copy.config.includedIds = [];
                copy.config.excludedIds = [];
                copy.config.includedHubIds = [];
                copy.config.excludedHubIds = [];
                selectedAppDefinitionItem.value = copy;
              }}
            />
          </Stack>
          <Stack gap={12}>
            <Subtitle2>Hub sites</Subtitle2>
            <Divider />
            <Stack>
              {hubStructure.length > 0 ? (
                <HubSites hubSites={hubStructure} control="switch" />
              ) : null}
            </Stack>

            <Subtitle2>Site collections</Subtitle2>
            <Divider />
            <Stack>
              {siteStructure.length > 0 ? (
                <SiteCollections
                  additionalIcon={<ArrowTurnDownRightRegular />}
                  siteCollections={siteStructure}
                  control="switch"
                />
              ) : null}
            </Stack>
            <Subtitle2>Webs</Subtitle2>
            <Divider />
            <Stack>
              {webStructure.length > 0 ? (
                <Webs
                  additionalIcon={<ArrowRightRegular />}
                  webs={webStructure}
                  control="switch"
                />
              ) : null}
            </Stack>
          </Stack>
        </>
      </DrawerBody>
      <DrawerFooter>
        <Stack horizontal gap={8} horizontalAlign="center">
          <Button
            appearance="secondary"
            onClick={() => {
              selectedAppDefinitionItem.value = undefined;
            }}
          >
            Cancel
          </Button>

          <Button
            appearance="primary"
            disabled={!modified}
            onClick={() => {
              if (!selectedAppDefinitionItem.value) return;
              const selectedAppCopy = cloneObject(selectedAppItem.value!);
              const selectedDefCopy = cloneObject(
                selectedAppDefinitionItem.value!
              );
              selectedAppCopy.manifest.appDefinitionMap =
                selectedAppCopy.manifest.appDefinitionMap.filter(
                  (a) => a.appId !== selectedDefCopy.appId
                );
              selectedAppCopy.manifest.appDefinitionMap.push(selectedDefCopy);
              selectedAppItem.value = selectedAppCopy;
              selectedAppDefinitionItem.value = undefined;
            }}
          >
            Save
          </Button>
        </Stack>
      </DrawerFooter>
    </Drawer>
  );
}
