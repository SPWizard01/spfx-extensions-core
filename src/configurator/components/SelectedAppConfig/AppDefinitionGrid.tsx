import {
  Button,
  Link,
  Skeleton,
  SkeletonItem,
} from "@fluentui/react-components";
import { AppFolder20Regular, EditRegular } from "@fluentui/react-icons";
import { useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import { selectedAppItem } from "../../runtimeStore";
import {
  getAppDefinitions,
  type ResolvedAppDefinitionMapItem,
} from "../../services/appDefinitionImport";
import { ManageSitesDrawerSignal } from "../common/ManageSitesDrawer";
import { Stack } from "../common/Stack";

export function AppDefinitionGrid() {
  const [appDefinitions, setAppDefinitions] = useState<
    ResolvedAppDefinitionMapItem[]
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
            {!appDefinitionsDownloaded ? (
              <Skeleton aria-label="Loading Content" style={{ width: "100%" }}>
                <SkeletonItem />
              </Skeleton>
            ) : (
              <>
                <Stack horizontal verticalAlign="center" gap={8} grow>
                  <AppFolder20Regular />{" "}
                  <Link
                    size="medium"
                    onClick={() => {
                      ManageSitesDrawerSignal.value = {
                        open: true,
                        appDefinition: {
                          appId: appDef.appId,
                          config: appDef.config,
                        },
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
                      ManageSitesDrawerSignal.value = {
                        open: true,
                        appDefinition: {
                          appId: appDef.appId,
                          config: appDef.config,
                        },
                      };
                    }}
                  />
                </Stack>
              </>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
