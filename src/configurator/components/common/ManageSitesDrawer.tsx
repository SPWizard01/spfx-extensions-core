import {
  Badge,
  Body1,
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  Label,
  MessageBar,
  MessageBarBody,
  Spinner,
  Switch,
  useRestoreFocusSource,
  webLightTheme,
} from "@fluentui/react-components";
import {
  Add16Regular,
  Delete16Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { signal, useComputed } from "@preact/signals";
import { useState } from "preact/hooks";
import type {
  SPFxExtensionCollectionManifest,
  SPFxExtensionUrlMapItem,
} from "../../../models/appCollectionManifest";
import type {
  SPFxExtensionAppDefinitionMapItem,
  SPFxExtensionFolderManifest,
} from "../../../models/appFolderManifest";
import type { ConfiguratorURLMapItem } from "../../models/urlMapItemExtended";
import {
  appCollectionUpdating,
  configurationIsGlobal,
  configurationRootWeb,
  configurationSite,
  configurationWebSP,
  configurationWebSubWebs,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
  selectedAppItem,
} from "../../runtimeStore";
import { updateAppCollection } from "../../services/appCollection";
import { updateAppManifest } from "../../services/appManifest";
import { validateUrl } from "../../services/urlService";
import { resolveWebStructure } from "../../services/webInfoService";
import { Stack } from "./Stack";
import { StackItem } from "./StackItem";

export const ManageSitesDrawerSignal = signal<{
  open: boolean;
  appDefinition?: SPFxExtensionAppDefinitionMapItem | undefined;
}>({
  open: false,
  appDefinition: undefined,
});

export default function ManageSitesDrawer() {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [urlInputError, setUrlInputError] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isResolving, setIsResolving] = useState(false);
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

  async function addSite() {
    if (!urlInput) return;

    const validatedSite = validateUrl(urlInput);

    if (validatedSite.error) {
      // Handle error
      setUrlInputError(validatedSite.error.message);
      return;
    }

    const urlToResolve = urlInput.startsWith("/")
      ? new URL(urlInput, window.location.origin)
      : new URL(urlInput);
    setIsResolving(true);
    const structureResult = await resolveWebStructure(urlToResolve);
    if (structureResult.isError) {
      setUrlInputError(structureResult.error);
      setIsResolving(false);
      return;
    }
    if (getConfigurationWebIsRootHub()) {
      if (
        !structureResult.data.every(
          (s) => s.hubid === configurationSite.data.HubSiteId
        )
      ) {
        setUrlInputError(
          "You can only add child hub sites when configuring a hub root."
        );
        setIsResolving(false);
        return;
      }
    }
    const collectionCopy: SPFxExtensionCollectionManifest = JSON.parse(
      JSON.stringify(contextCollectionConfig.value)
    );
    structureResult.data.forEach((item) => {
      if (!collectionCopy.urlMap.some((s) => s.id === item.id)) {
        collectionCopy.urlMap.push(item);
      }
    });

    contextCollectionConfig.value = collectionCopy;

    setUrlInputError("");
    setUrlInput("");
    setIsResolving(false);
  }

  function deleteSite(web: SPFxExtensionUrlMapItem) {
    const collectionCopy: SPFxExtensionCollectionManifest = JSON.parse(
      JSON.stringify(contextCollectionConfig.value)
    );

    const itemIndex = collectionCopy.urlMap.findIndex((s) => s.id === web.id);

    if (itemIndex < 0) {
      return;
    }
    collectionCopy.urlMap.splice(itemIndex, 1);
    contextCollectionConfig.value = collectionCopy;
  }

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={ManageSitesDrawerSignal.value.open}
      onOpenChange={(_: any, { open }: { open: boolean }) => {
        setUrlInputError("");
        setUrlInput("");
        ManageSitesDrawerSignal.value = {
          ...ManageSitesDrawerSignal.value,
          open,
        };
      }}
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
              onClick={() =>
                (ManageSitesDrawerSignal.value = {
                  open: false,
                })
              }
            />
          }
        >
          {ManageSitesDrawerSignal.value.appDefinition
            ? "Enable app on sites"
            : "Manage sites"}
        </DrawerHeaderTitle>
      </DrawerHeader>
      {configurationIsGlobal || getConfigurationWebIsRootHub() ? (
        <Stack style={{ padding: "8px 24px", width: "100%" }} gap={8}>
          <MessageBar intent="info">
            <MessageBarBody>
              {ManageSitesDrawerSignal.value.appDefinition
                ? `Choose sites where to enable app ${ManageSitesDrawerSignal.value.appDefinition.appId}`
                : "Add site collections and hub child sites."}
            </MessageBarBody>
          </MessageBar>
          {!ManageSitesDrawerSignal.value.appDefinition && (
            <>
              <Stack horizontal gap={8}>
                <Input
                  style={{
                    width: "100%",
                  }}
                  onChange={(_, d) => {
                    setUrlInput(d.value);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      addSite();
                    }
                  }}
                  onFocus={() => {
                    setUrlInputError("");
                  }}
                  value={urlInput}
                  placeholder="Site/Web URL"
                />
                <Button
                  disabled={!urlInput || isResolving}
                  onClick={() => addSite()}
                  icon={
                    isResolving ? <Spinner size="tiny" /> : <Add16Regular />
                  }
                >
                  Add
                </Button>
              </Stack>
              {urlInputError && (
                <Body1
                  style={{ color: webLightTheme.colorPaletteRedForeground1 }}
                >
                  {urlInputError}
                </Body1>
              )}
            </>
          )}
        </Stack>
      ) : null}

      <DrawerBody>
        <Stack gap={16} style={{ padding: "8px 0px" }}>
          <Stack gap={4}>
            {ManageSitesDrawerSignal.value.appDefinition ? (
              <Stack
                horizontal
                horizontalAlign="space-between"
                verticalAlign="center"
              >
                <Label>Enable everywhere</Label>
                <Switch
                  defaultChecked={
                    ManageSitesDrawerSignal.value.appDefinition?.config
                      .enabledEverywhere
                  }
                />
              </Stack>
            ) : null}
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
                {ManageSitesDrawerSignal.value.appDefinition ? (
                  <>
                    {site.isRootWeb ? (
                      <>
                        <Label>Enable for all collection</Label>
                        <Switch
                          defaultChecked={
                            ManageSitesDrawerSignal.value.appDefinition?.config
                              .enabledEverywhere &&
                            !ManageSitesDrawerSignal.value.appDefinition?.config.excludedIds.some(
                              (s) => s === site.id
                            )
                          }
                        />
                      </>
                    ) : null}
                    <Switch
                      defaultChecked={
                        ManageSitesDrawerSignal.value.appDefinition?.config
                          .enabledEverywhere &&
                        !ManageSitesDrawerSignal.value.appDefinition?.config.excludedIds.some(
                          (s) => s === site.id
                        )
                      }
                    />
                  </>
                ) : (
                  <Button
                    disabled={!site.canDelete}
                    onClick={() => deleteSite(site)}
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
            onClick={() =>
              (ManageSitesDrawerSignal.value = {
                open: false,
              })
            }
          >
            Cancel
          </Button>
          {contextCollectionConfig.value ? (
            <Button
              appearance="primary"
              disabled={appCollectionUpdating.value}
              onClick={async () => {
                await updateAppCollection(
                  configurationWebSP,
                  contextCollectionConfig.value
                );
                ManageSitesDrawerSignal.value = {
                  open: false,
                };
              }}
            >
              Save
            </Button>
          ) : null}
          {ManageSitesDrawerSignal.value.appDefinition &&
          selectedAppItem.value ? (
            <Button
              appearance="primary"
              disabled={!ManageSitesDrawerSignal.value.appDefinition}
              onClick={async () => {
                const newDef: SPFxExtensionFolderManifest = JSON.parse(
                  JSON.stringify(selectedAppItem.value!.manifest)
                );
                const foundItem = newDef.appDefinitionMap.findIndex(
                  (a) =>
                    a.appId ===
                    ManageSitesDrawerSignal.value.appDefinition?.appId
                );
                if (foundItem < 0) {
                  newDef.appDefinitionMap.push(
                    ManageSitesDrawerSignal.value.appDefinition!
                  );
                } else {
                  newDef.appDefinitionMap[foundItem] =
                    ManageSitesDrawerSignal.value.appDefinition!;
                }
                await updateAppManifest(
                  configurationWebSP,
                  selectedAppItem.value!.name,
                  newDef
                );
                ManageSitesDrawerSignal.value = {
                  open: false,
                };
              }}
            >
              Save
            </Button>
          ) : null}
        </Stack>
      </DrawerFooter>
    </Drawer>
  );
}
