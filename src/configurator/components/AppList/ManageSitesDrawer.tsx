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
  MessageBar,
  MessageBarBody,
  Spinner,
  useRestoreFocusSource,
  webLightTheme,
} from "@fluentui/react-components";
import {
  Add16Regular,
  Delete16Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
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
import { validateUrl } from "../../services/urlService";
import { resolveWebStructure } from "../../services/webInfoService";
import { Stack } from "../common/Stack";
import { StackItem } from "../common/StackItem";

export const ManageSitesDrawerSignal = signal(false);

export function ManageSitesDrawer() {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [urlInputError, setUrlInputError] = useState("");
  const [urlInput, setUrlInput] = useState("");
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
    const collectionUrlMapCopy: ConfiguratorURLMapItem[] = JSON.parse(
      JSON.stringify(collectionUrlMap)
    );
    let somethingAdded = false;
    structureResult.data.forEach((item) => {
      if (!collectionUrlMapCopy.some((s) => s.id === item.id)) {
        collectionUrlMapCopy.push({
          ...item,
          canDelete: true,
        });
        somethingAdded = true;
      }
    });
    setCollectionUrlMap(collectionUrlMapCopy);
    setUrlInputError("");
    setUrlInput("");
    setIsResolving(false);
    if (somethingAdded) {
      setModified(true);
    }
  }

  function deleteSite(web: SPFxExtensionUrlMapItem) {
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
    } finally {
      setIsResolving(false);
      setUrlInputError("");
      setUrlInput("");
      setModified(false);
      setCollectionUrlMap([]);
      ManageSitesDrawerSignal.value = false;
      contextCollectionConfig.value = contextCopy;
    }
  }

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={ManageSitesDrawerSignal.value}
      onOpenChange={() => {
        setUrlInputError("");
        setUrlInput("");
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
              onClick={() => {
                ManageSitesDrawerSignal.value = false;
              }}
            />
          }
        >
          Manage sites
        </DrawerHeaderTitle>
      </DrawerHeader>
      <Stack style={{ padding: "8px 24px", width: "100%" }} gap={8}>
        <MessageBar intent="info">
          <MessageBarBody>
            Add site collections and hub child sites.
          </MessageBarBody>
        </MessageBar>
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
            icon={isResolving ? <Spinner size="tiny" /> : <Add16Regular />}
          >
            Add
          </Button>
        </Stack>
        {urlInputError ? (
          <Body1 style={{ color: webLightTheme.colorPaletteRedForeground1 }}>
            {urlInputError}
          </Body1>
        ) : null}
      </Stack>

      <DrawerBody>
        <Stack gap={16} style={{ padding: "8px 0px" }}>
          <Stack gap={4}>
            {collectionUrlMap.map((site) => (
              <Stack
                horizontalAlign="space-between"
                verticalAlign="center"
                horizontal
                gap={8}
                key={site.id}
              >
                <>
                  TODO: Split me and ManageAppDefinitionMapItemDrawer part so I
                  can be reused
                </>
                <Stack horizontal gap={8} verticalAlign="center">
                  {site.isRootWeb && <Badge size="small">Hub root</Badge>}
                  {!site.isHubRoot && site.hubid && (
                    <Badge color="warning" size="small">
                      Hub child
                    </Badge>
                  )}
                  <StackItem>{site.url}</StackItem>
                </Stack>
                <Button
                  disabled={!site.canDelete}
                  onClick={() => deleteSite(site)}
                  icon={<Delete16Regular />}
                />
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
