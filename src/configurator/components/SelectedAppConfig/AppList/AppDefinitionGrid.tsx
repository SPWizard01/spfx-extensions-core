import { Button, Link, ProgressBar } from "@fluentui/react-components";
import { AppFolder20Regular, EditRegular } from "@fluentui/react-icons";
import { useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import type { AppCollectionConfigurationItem } from "../../../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../../../models/AppFolderManifestDefinitionItem";
import {
  selectedAppDeinitionMapItem,
  selectedAppItem,
} from "../../../runtimeStore";
import { getAppDefinitions } from "../../../services/appDefinitionImport";
import { Stack } from "../../common/Stack";
import { ManageAppDefinitionMapItemDrawer } from "./ManageAppDefinitionMapItemDrawer";

export function AppDefinitionGrid() {
  const [appDefinitions, setAppDefinitions] = useState<
    AppFolderManifestDefinitionItem[]
  >([]);
  const [appDefinitionsDownloaded, setAppDefinitionsDownloaded] =
    useState(false);

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    setAppDefinitionsDownloaded(false);
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    setAppDefinitionsDownloaded(true);
    setAppDefinitions(allAppDefinitions);
  }

  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    downloadData(selectedAppItem.value);
  });
  if (!selectedAppItem.value) return null;
  if (!appDefinitionsDownloaded) {
    return (
      <Stack style={{ marginTop: "10px" }}>
        <ProgressBar />
      </Stack>
    );
  }

  return (
    <Stack
      style={{
        marginTop: "10px",
        borderBottom: "1px solid #eaeaea",
      }}
    >
      {appDefinitions.map((appDef) => {
        return (
          <Stack
            horizontal
            gap={8}
            horizontalAlign="space-between"
            verticalAlign="center"
            style={{
              borderTop: "1px solid #eaeaea",
              padding: "10px 6px",
              minHeight: "53px",
            }}
          >
            <Stack horizontal verticalAlign="center" gap={8} grow>
              <AppFolder20Regular />{" "}
              <Link
                size="medium"
                onClick={() => {
                  selectedAppDeinitionMapItem.value = {
                    appId: appDef.appId,
                    config: appDef.config,
                  };
                }}
              >
                {appDef.name}
              </Link>
            </Stack>
            <Stack gap={8} horizontal>
              <Button
                aria-label="Edit sites"
                icon={<EditRegular />}
                onClick={() => {
                  selectedAppDeinitionMapItem.value = {
                    appId: appDef.appId,
                    config: appDef.config,
                  };
                }}
              />
            </Stack>
          </Stack>
        );
      })}
      <ManageAppDefinitionMapItemDrawer appDefinitions={appDefinitions} />
    </Stack>
  );
}
