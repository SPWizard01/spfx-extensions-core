import {
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
  Switch,
  useRestoreFocusSource,
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
import type { ConfiguratorURLMapItem } from "../../models/urlMapItemExtended";
import {
  appCollectionUpdating,
  configurationIsGlobal,
  configurationRootWeb,
  configurationWebSP,
  configurationWebSubWebs,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
  selectedAppItem,
} from "../../runtimeStore";
import { updateAppCollection } from "../../services/appCollection";
import { validateUrl } from "../../services/urlService";
import { resolveWebStructure } from "../../services/webInfoService";
import type { AppIdName } from "../SelectedAppConfig/AppDefinitionGrid";
import { Stack } from "./Stack";
import { StackItem } from "./StackItem";

export const ManageSitesDrawerSignal = signal<{
  open: boolean;
  appDefinition?: AppIdName | undefined;
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
            isRootWeb: w.Id === configurationRootWeb.data.Id,
            siteId: w.Id,
            url: w.Url,
            canDelete: false,
          };
        })
      : [];
    contextCollectionConfig.value.urlMap.forEach((item) => {
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
        <Stack style={{ padding: "12px 24px", width: "100%" }} gap={8}>
          <MessageBar intent="info">
            <MessageBarBody>
              {ManageSitesDrawerSignal.value.appDefinition
                ? "Enable app on sites."
                : "Add site collections and hub child sites."}
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
              value={urlInput}
              placeholder="Site/Web URL"
            />
            <Button
              disabled={!urlInput || isResolving}
              onClick={() => addSite()}
              icon={<Add16Regular />}
            >
              Add
            </Button>
          </Stack>

          {urlInputError && (
            <MessageBar intent="error">
              <MessageBarBody>{urlInputError}</MessageBarBody>
            </MessageBar>
          )}
          {isResolving && (
            <MessageBar intent="info">
              <MessageBarBody>Resolving...</MessageBarBody>
            </MessageBar>
          )}
        </Stack>
      ) : null}

      <DrawerBody>
        <Stack gap={16} style={{ padding: "12px 0px" }}>
          <Stack gap={8}>
            {ManageSitesDrawerSignal.value.appDefinition ? (
              <Stack
                horizontal
                horizontalAlign="space-between"
                verticalAlign="center"
              >
                <Label>Enable everywhere</Label>
                <Switch />
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
                <StackItem>{site.url}</StackItem>
                {ManageSitesDrawerSignal.value.appDefinition ? (
                  <>
                    {site.isRootWeb ? (
                      <>
                        <Label>Enable for all collection</Label>
                        <Switch />
                      </>
                    ) : null}
                    <Switch />
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
        </Stack>
      </DrawerFooter>
    </Drawer>
  );
}
