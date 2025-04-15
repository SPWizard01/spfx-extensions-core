import { Button, Label } from "@fluentui/react-components";
import {
  AppFolder20Regular,
  DeleteRegular,
  EditRegular,
} from "@fluentui/react-icons";
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
export interface AppIdName {
  id: string;
  name: string;
}

// interface WebIdName {
//   Id: string;
//   Name: string;
//   Url: string;
//   isSubWeb: boolean;
// }

export const AppDefinitionGrid = () => {
  const app = selectedAppItem.value;
  console.log("AppDefinitionGrid", app);
  const [appDefinitions, setAppDefinitions] = useState<
    ResolvedAppDefinitionMapItem[]
  >([]);
  // const [webIdMap, setWebIdMap] = useState<WebIdAppIdMap[]>([]);

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    console.log("allAppDefinitions", allAppDefinitions);
    setAppDefinitions(allAppDefinitions);
  }

  useSignalEffect(() => {
    if (!selectedAppItem.value) return;
    downloadData(selectedAppItem.value);
  });
  if (!app) return null;

  return (
    <Stack
      style={{
        marginTop: "10px",
        borderBottom: "1px solid #eaeaea",
      }}
    >
      {appDefinitions.map((appDef) => (
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
            <AppFolder20Regular /> <Label size="medium">{appDef.name}</Label>
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
            {!app.manifest.isESM && (
              <Button
                aria-label="Delete"
                icon={<DeleteRegular />}
                onClick={() => {
                  console.log("Delete clicked");
                }}
              />
            )}
          </Stack>
        </Stack>
      ))}
    </Stack>
    // <DataGrid
    //   items={appDefinitions}
    //   columns={columns}
    //   getRowId={(item: AppIdName) => item.id}
    //   style={{
    //     minWidth: "100%",
    //   }}
    //   columnSizingOptions={{
    //     actions: {
    //       maxWidth: 100,
    //       idealWidth: 100,
    //     },
    //   }}
    // >
    //   <DataGridHeader>
    //     <DataGridRow>
    //       {({ renderHeaderCell }) => (
    //         <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
    //       )}
    //     </DataGridRow>
    //   </DataGridHeader>
    //   <DataGridBody<AppIdName>>
    //     {({ item, rowId }) => (
    //       <DataGridRow<AppIdName> key={rowId}>
    //         {({ renderCell }) => (
    //           <DataGridCell>{renderCell(item)}</DataGridCell>
    //         )}
    //       </DataGridRow>
    //     )}
    //   </DataGridBody>
    // </DataGrid>
  );
};
