import { Button, Link, ProgressBar } from "@fluentui/react-components";
import {
  AppFolder20Regular,
  Delete16Regular,
  EditRegular,
  TargetRegular,
  Warning20Regular,
} from "@fluentui/react-icons";
import { useSignal, useSignalEffect } from "@preact/signals";
import type { SPFxExtensionManualAppEntry } from "../../../../models/appFolderManifest";
import { cloneObject } from "../../../../utilities/helpers";
import type { AppCollectionConfigurationItem } from "../../../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../../../models/AppFolderManifestDefinitionItem";
import {
  selectedAppDefinitionItem,
  selectedAppItem,
  selectedAppManualDefinitionItem,
} from "../../../runtimeStore";
import { getAppDefinitions } from "../../../services/appDefinitionImport";
import { Stack } from "../../common/Stack";
import { ManageAppDefinitionMapItemDrawer } from "./ManageAppDefinitionMapItemDrawer";

export function AppDefinitionGrid() {
  const appDefinitions = useSignal<AppFolderManifestDefinitionItem[]>([]);
  const appDefinitionsDownloaded = useSignal(false);

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    appDefinitionsDownloaded.value = false;
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    appDefinitionsDownloaded.value = true;
    appDefinitions.value = allAppDefinitions;
  }

  function deleteDefinitionItem(item: AppFolderManifestDefinitionItem) {
    if (!selectedAppItem.value) return;
    const copy = cloneObject(selectedAppItem.value);
    copy.manifest.appDefinitionMap = copy.manifest.appDefinitionMap.filter(
      (a) => a.appId !== item.appId
    );
    copy.manifest.manualEntries = copy.manifest.manualEntries.filter((a) => a.appId !== item.appId);
    selectedAppItem.value = copy;
  }

  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    downloadData(selectedAppItem.value);
  });
  if (!selectedAppItem.value) return null;
  if (!appDefinitionsDownloaded.value) {
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
      {appDefinitions.value.map((appDef) => {
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
              {appDef.isManual ? <Warning20Regular /> : <AppFolder20Regular />}{" "}
              <Link
                size="medium"
                onClick={() => {
                  selectedAppDefinitionItem.value = {
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
                aria-label="Delete configuration item"
                icon={<Delete16Regular />}
                disabled={!appDef.isManual && appDef.resolved}
                onClick={() => {
                  deleteDefinitionItem(appDef);
                }}
              />
              <Button
                aria-label="Edit item"
                icon={<EditRegular />}
                disabled={!appDef.isManual}
                onClick={() => {
                  const manualDef = selectedAppItem.value?.manifest.manualEntries.find(
                    (def) => def.appId === appDef.appId
                  );
                  if (!manualDef) return;
                  selectedAppManualDefinitionItem.value = cloneObject(manualDef);
                }}
              />
              <Button
                aria-label="Edit sites"
                icon={<TargetRegular />}
                onClick={() => {
                  selectedAppDefinitionItem.value = {
                    appId: appDef.appId,
                    config: appDef.config,
                  };
                }}
              />
            </Stack>
          </Stack>
        );
      })}
      <ManageAppDefinitionMapItemDrawer appDefinitions={appDefinitions.value} />
    </Stack>
  );
}
