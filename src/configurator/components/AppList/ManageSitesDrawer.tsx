import {
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  MessageBar,
  MessageBarBody,
  useRestoreFocusSource,
} from "@fluentui/react-components";
import {
  Add16Regular,
  Delete16Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { useState } from "preact/hooks";
import { Stack } from "../@common/Stack";
import { StackItem } from "../@common/StackItem";
import { ManageSitesDrawerSignal } from "./AppList";

const URL_VALIDATION_ERROR = {
  invalid: {
    message: "Invalid URL",
  },
  duplicate: {
    message: "URL already exists",
  },
};

interface SiteCollectionInfo {
  webId: string;
  url: string;
}

export default function ManageSitesDrawer() {
  const restoreFocusSourceAttributes = useRestoreFocusSource();
  const [urlInputError, setUrlInputError] = useState<string>();
  const [siteList, setSiteList] = useState<SiteCollectionInfo[]>([
    {
      webId: crypto.randomUUID(),
      url: "https://contoso.sharepoint.com/sites/1",
    },
  ]);
  const [urlInput, setUrlInput] = useState<string>();

  function addSite() {
    if (!urlInput) return;

    const validatedSite = validateUrl(urlInput);

    if (validatedSite.error) {
      // Handle error
      setUrlInputError(validatedSite.error.message);
      return;
    }

    setSiteList((prev) => [...prev, validatedSite.siteCollectionInfo!]);
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
    const isDuplicate = siteList.some((site) => site.url === urlInput);

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

  function deleteSite(site: SiteCollectionInfo) {
    // Delete site from site list
    setSiteList((prev) => prev.filter((s) => s.webId !== site.webId));
  }

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      separator
      open={ManageSitesDrawerSignal.value}
      onOpenChange={(_: any, { open }: { open: boolean }) => {
        setUrlInputError(undefined);
        setUrlInput(undefined);
        ManageSitesDrawerSignal.value = open;
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
              onClick={() => (ManageSitesDrawerSignal.value = false)}
            />
          }
        >
          Manage sites
        </DrawerHeaderTitle>
      </DrawerHeader>
      <Stack style={{ padding: "12px 24px", width: "100%" }} gap={8}>
        <MessageBar intent="info">
          <MessageBarBody>
            Add applicable site collections and hub child sites.
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
            placeholder="Site collection URL"
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
      <DrawerBody>
        <Stack gap={16} style={{ padding: "12px 0px" }}>
          <Stack gap={8}>
            {siteList.map((site) => (
              <Stack
                horizontalAlign="space-between"
                verticalAlign="center"
                horizontal
                gap={8}
                key={site.webId}
              >
                <StackItem>{site.url}</StackItem>
                <Button
                  onClick={() => deleteSite(site)}
                  icon={<Delete16Regular />}
                />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DrawerBody>
    </Drawer>
  );
}
