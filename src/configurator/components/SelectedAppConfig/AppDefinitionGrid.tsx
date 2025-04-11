import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Label,
  TableCellLayout,
  TableRow,
  createTableColumn,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import { DeleteRegular, EditRegular } from "@fluentui/react-icons";
import { useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import { selectedAppItem } from "../../runtimeStore";
import { getAppDefinitions } from "../../services/appDefinitionImport";
import { Stack } from "../@common/Stack";
import { StackItem } from "../@common/StackItem";

const columns: TableColumnDefinition<AppIdName>[] = [
  createTableColumn<AppIdName>({
    columnId: "name",
    renderHeaderCell: () => {
      return "Name";
    },
    renderCell: (item) => {
      return <TableCellLayout>{item.name}</TableCellLayout>;
    },
  }),
  createTableColumn<AppIdName>({
    columnId: "actions",
    renderHeaderCell: () => {
      return "Actions";
    },

    renderCell: () => {
      return (
        <>
          <Button aria-label="Edit" icon={<EditRegular />} />
          <Button aria-label="Delete" icon={<DeleteRegular />} />
        </>
      );
    },
  }),
];

interface AppIdName {
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

  const [appDefinitions, setAppDefinitions] = useState<AppIdName[]>([]);
  // const [webIdMap, setWebIdMap] = useState<WebIdAppIdMap[]>([]);

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    // const allWebIds: WebIdAppIdMap[] = [];

    // allWebIds.push(
    //   ...selectedWebAvailableWebs.map((w) => ({
    //     Id: w.Id,
    //     Name: w.Title,
    //     Url: w.ServerRelativeUrl,
    //     isSubWeb: true,
    //     enabledApps: [],
    //   }))
    // );
    downloadDataApp.manifest.appDefinitionMap?.forEach((w) => {
      // const web = allWebIds.find((w1) => w1.Id === w.webId);
      // if (web) {
      //   web.enabledApps = w.enabledAppIds;
      // } else {
      //   allWebIds.push({
      //     Id: w.webId,
      //     Name: "Unknown",
      //     Url: `Unknown_${w.webId}`,
      //     isSubWeb: false,
      //     enabledApps: w.enabledAppIds,
      //   });
      // }
    });
    // setWebIdMap(allWebIds);
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
            borderBottom: "1px solid #eaeaea",
            padding: "10px 6px",
          }}
        >
          <StackItem>
            <Label size="large" weight="semibold">
              {appDef.name}
            </Label>
          </StackItem>
          <Stack gap={8} horizontal>
            <Button
              aria-label="Edit sites"
              icon={<EditRegular />}
              onClick={() => {
                console.log("Edit clicked");
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
