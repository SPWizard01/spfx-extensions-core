import {
  Badge,
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Label,
  MessageBar,
  MessageBarBody,
  Switch,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import { Delete16Regular, Dismiss24Regular } from "@fluentui/react-icons";
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
import { Stack } from "../common/Stack";
import { StackItem } from "../common/StackItem";

interface IProps {
  appDefinitions: AppFolderManifestDefinitionItem[];
}

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
  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={!!selectedAppDeinitionMapItem.value}
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
              <Label>Enable everywhere</Label>
              <Switch
                defaultChecked={
                  selectedAppDeinitionMapItem.value.config.enabledEverywhere
                }
              />
            </Stack>
            {urlList.value.map((site) => (
              <Stack
                horizontalAlign="space-between"
                verticalAlign="center"
                horizontal
                gap={8}
                key={site.id}
              >
                <Stack horizontal gap={8} verticalAlign="center">
                  {site.isRootWeb && <Badge size="small">Hub root</Badge>}
                  {!site.isHubRoot && site.hubid && (
                    <Badge color="warning" size="small">
                      Hub child
                    </Badge>
                  )}
                  <StackItem>{site.url}</StackItem>
                </Stack>
                {selectedAppDeinitionMapItem.value ? (
                  <>
                    {site.isRootWeb ? (
                      <>
                        <Label>Enable for all collection</Label>
                        <Switch
                          defaultChecked={
                            selectedAppDeinitionMapItem.value.config
                              .enabledEverywhere &&
                            !selectedAppDeinitionMapItem.value.config.excludedIds.some(
                              (s) => s === site.id
                            )
                          }
                        />
                      </>
                    ) : null}
                    <Switch
                      defaultChecked={
                        selectedAppDeinitionMapItem.value.config
                          .enabledEverywhere &&
                        !selectedAppDeinitionMapItem.value.config.excludedIds.some(
                          (s) => s === site.id
                        )
                      }
                    />
                  </>
                ) : (
                  <Button
                    disabled={!site.canDelete}
                    onClick={() => {}}
                    icon={<Delete16Regular />}
                  />
                )}
              </Stack>
            ))}
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
