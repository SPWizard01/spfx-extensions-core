import {
  Body1,
  Button,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  webLightTheme,
} from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { useState } from "preact/hooks";
import type { SPFxExtensionCollectionManifest } from "../../../models/appCollectionManifest";
import {
  configurationSite,
  contextCollectionConfig,
  getConfigurationWebIsRootHub,
} from "../../runtimeStore";
import { validateUrl } from "../../services/urlService";
import { resolveWebStructure } from "../../services/webInfoService";
import { Stack } from "../common/Stack";

export function AddSite() {
  const [urlInputError, setUrlInputError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isResolving, setIsResolving] = useState(false);
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
    const structureResult = await resolveWebStructure(urlToResolve, true);
    setIsResolving(false);
    if (structureResult.isError) {
      setUrlInputError(structureResult.error);
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
        return;
      }
    }
    const collectionCopy: SPFxExtensionCollectionManifest = JSON.parse(
      JSON.stringify(contextCollectionConfig.value)
    );
    collectionCopy.urlMap = collectionCopy.urlMap.filter((item) => {
      return !structureResult.data.some((s) => s.id === item.id);
    });
    collectionCopy.urlMap.push(...structureResult.data);
    contextCollectionConfig.value = collectionCopy;
    setUrlInputError("");
    setUrlInput("");
  }
  return (
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
  );
}
