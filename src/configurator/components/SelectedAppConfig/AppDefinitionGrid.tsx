import { Button, Link } from "@fluentui/react-components";
import { AppFolder20Regular, EditRegular } from "@fluentui/react-icons";
import { useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import { selectedAppItem } from "../../runtimeStore";
import { getAppDefinitions } from "../../services/appDefinitionImport";
import { ManageSitesDrawerSignal } from "../common/ManageSitesDrawer";
import { Stack } from "../common/Stack";
export interface AppIdName {
  id: string;
  name: string;
}

export const AppDefinitionGrid = () => {
  const app = selectedAppItem.value;

  const [appDefinitions, setAppDefinitions] = useState<AppIdName[]>([]);

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    setAppDefinitions(allAppDefinitions);
  }

  useSignalEffect(() => {
    if (!app) return;
    downloadData(app);
  });
  if (!app) return null;

  return (
    <Stack
      style={{
        marginTop: "10px",
        borderBottom: "1px solid #eaeaea",
      }}
    >
      {selectedAppItem.value?.manifest.appDefinitionMap.map((appDef) => {
        console.log(appDefinitions, appDef);
        return (
          <Stack
            horizontal
            gap={8}
            horizontalAlign="space-between"
            verticalAlign="center"
            style={{
              borderTop: "1px solid #eaeaea",
              padding: "10px 6px",
            }}
          >
            <Stack horizontal verticalAlign="center" gap={8}>
              <AppFolder20Regular />{" "}
              <Link
                size="medium"
                onClick={() => {
                  ManageSitesDrawerSignal.value = {
                    open: true,
                    appDefinition: appDef,
                  };
                }}
              >
                {appDefinitions.find((a) => a.id == appDef.appId)?.name ??
                  `Unknown_${appDef.appId}`}
              </Link>
            </Stack>
            <Stack gap={8} horizontal>
              <Button
                aria-label="Edit sites"
                icon={<EditRegular />}
                onClick={() => {
                  ManageSitesDrawerSignal.value = {
                    open: true,
                    appDefinition: appDef,
                  };
                }}
              />
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
};
