import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableCellLayout,
  createTableColumn,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import { DeleteRegular, EditRegular } from "@fluentui/react-icons";
import { useSignalEffect } from "@preact/signals";
import { useState } from "preact/hooks";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import { selectedAppItem, selectedWebAvailableWebs } from "../../runtimeStore";
import { getAppDefinitions } from "../../services/appDefinitionImport";

const columns: TableColumnDefinition<WebIdAppIdMap>[] = [
  createTableColumn<WebIdAppIdMap>({
    columnId: "name",
    renderHeaderCell: () => {
      return "Name";
    },
    renderCell: (item) => {
      return <TableCellLayout>{item.Name}</TableCellLayout>;
    },
  }),
  createTableColumn<WebIdAppIdMap>({
    columnId: "web",
    renderHeaderCell: () => {
      return "Web";
    },
    renderCell: (item) => {
      return <TableCellLayout>{item.Url}</TableCellLayout>;
    },
  }),
  createTableColumn<WebIdAppIdMap>({
    columnId: "actions",
    renderHeaderCell: () => {
      return "Actions";
    },
    renderCell: () => {
      return (
        <TableCellLayout>
          <Button aria-label="Edit" icon={<EditRegular />} />
          <Button aria-label="Delete" icon={<DeleteRegular />} />
        </TableCellLayout>
      );
    },
  }),
];

interface AppIdName {
  id: string;
  name: string;
}

interface WebIdName {
  Id: string;
  Name: string;
  Url: string;
  isSubWeb: boolean;
}

interface WebIdAppIdMap extends WebIdName {
  enabledApps: string[];
}

export const AppDefinitionGrid = () => {
  const app = selectedAppItem.value;

  const [Alldefs, setAllDefs] = useState<AppIdName[]>([]);
  const [webIdMap, setWebIdMap] = useState<WebIdAppIdMap[]>([]);

  async function downloadData(downloadDataApp: AppCollectionConfigurationItem) {
    const allAppDefinitions = await getAppDefinitions(downloadDataApp);
    const allWebIds: WebIdAppIdMap[] = [];

    allWebIds.push(
      ...selectedWebAvailableWebs.map((w) => ({
        Id: w.Id,
        Name: w.Title,
        Url: w.ServerRelativeUrl,
        isSubWeb: true,
        enabledApps: [],
      }))
    );
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
    setWebIdMap(allWebIds);
    setAllDefs(allAppDefinitions);
  }

  useSignalEffect(() => {
    if (!app) return;
    downloadData(app);
  });
  if (!app) return null;

  return (
    <DataGrid
      items={webIdMap}
      columns={columns}
      getRowId={(item: WebIdAppIdMap) => item.Id}
    >
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => (
            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
          )}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<WebIdAppIdMap>>
        {({ item, rowId }) => (
          <DataGridRow<WebIdAppIdMap> key={rowId}>
            {({ renderCell }) => (
              <DataGridCell>{renderCell(item)}</DataGridCell>
            )}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
};
