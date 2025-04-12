import {
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
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
import { signal } from "@preact/signals";
import { useState } from "preact/hooks";
import type { SPFxExtensionUrlMapItem } from "../../../models/appCollectionManifest";
import {
  configurationIsGlobal,
  configurationIsRootHub,
  configurationWebIsSubsite,
  configurationWebSubWebs,
  contextCollectionConfig,
} from "../../runtimeStore";
import type { AppIdName } from "../SelectedAppConfig/AppDefinitionGrid";
import { Stack } from "./Stack";
import { StackItem } from "./StackItem";

const URL_VALIDATION_ERROR = {
  invalid: {
    message: "Invalid URL",
  },
  duplicate: {
    message: "URL already exists",
  },
};

export const ManageSitesDrawerSignal = signal<{
  open: boolean;
  appDefinition?: AppIdName | undefined;
}>({
  open: false,
  appDefinition: undefined,
});

export default function ManageSitesDrawer() {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [urlInputError, setUrlInputError] = useState<string>();
  const list: SPFxExtensionUrlMapItem[] =
    !configurationIsGlobal && !configurationIsRootHub
      ? configurationWebSubWebs.map((w) => {
          return {
            id: w.Id,
            
            url: w.Url,
            type: configurationWebIsSubsite ? "web" : "site",
          };
        })
      : contextCollectionConfig.value.urlMap;
  const [urlInput, setUrlInput] = useState<string>();

  function addSite() {
    if (!urlInput) return;

    const validatedSite = validateUrl(urlInput);

    if (validatedSite.error) {
      // Handle error
      setUrlInputError(validatedSite.error.message);
      return;
    }

    setUrlInputError(undefined);
    setUrlInput(undefined);
  }
  function validateUrl(urlInput: string) {
    let error;
    let siteCollectionInfo;

    // Validate if URL is valid site collection and is not already in the list
    const isValidUrl =
      urlInput.startsWith("https://") && urlInput.includes(".sharepoint.com");

    if (!isValidUrl) {
      error = URL_VALIDATION_ERROR.invalid;
    }
    const isDuplicate = contextCollectionConfig.value.urlMap.some(
      (site) => site.url === urlInput
    );

    if (isDuplicate) {
      error = URL_VALIDATION_ERROR.duplicate;
    }

    if (isValidUrl && !isDuplicate) {
      siteCollectionInfo = {
        webId: crypto.randomUUID(),
        url: urlInput,
      };
    }
    return {
      siteCollectionInfo,
      error,
    };
  }

  function deleteSite(_site: SPFxExtensionUrlMapItem) {
    // Delete site from site list
  }

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={ManageSitesDrawerSignal.value.open}
      onOpenChange={(_: any, { open }: { open: boolean }) => {
        setUrlInputError(undefined);
        setUrlInput(undefined);
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
      {configurationIsGlobal || configurationIsRootHub ? (
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
              disabled={!urlInput}
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
        </Stack>
      ) : null}

      <DrawerBody>
        <Stack gap={16} style={{ padding: "12px 0px" }}>
          <Stack gap={8}>
            {list.map((site) => (
              <Stack
                horizontalAlign="space-between"
                verticalAlign="center"
                horizontal
                gap={8}
                key={site.id}
              >
                <StackItem>{site.url}</StackItem>
                {ManageSitesDrawerSignal.value.appDefinition ? (
                  <Switch />
                ) : (
                  <Button
                    onClick={() => deleteSite(site)}
                    icon={<Delete16Regular />}
                  />
                )}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DrawerBody>
    </Drawer>
  );
}
