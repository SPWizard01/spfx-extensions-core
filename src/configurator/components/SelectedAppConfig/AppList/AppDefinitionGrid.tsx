import { Button, Link, ProgressBar } from "@fluentui/react-components";
import {
  AppFolder20Regular,
  Delete16Regular,
  EditRegular,
} from "@fluentui/react-icons";
import { useSignal, useSignalEffect } from "@preact/signals";
import { cloneObject } from "../../../../utilities/helpers";
import type { AppCollectionConfigurationItem } from "../../../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../../../models/AppFolderManifestDefinitionItem";
import {
  selectedAppDefinitionItem,
  selectedAppItem,
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
              <AppFolder20Regular />{" "}
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
              {!selectedAppItem.value!.manifest.isESM ||
              (selectedAppItem.value!.manifest.isESM && !appDef.resolved) ? (
                <Button
                  aria-label="Delete configuration item"
                  icon={<Delete16Regular />}
                  onClick={() => {
                    deleteDefinitionItem(appDef);
                  }}
                />
              ) : null}

              <Button
                aria-label="Edit sites"
                icon={<EditRegular />}
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
