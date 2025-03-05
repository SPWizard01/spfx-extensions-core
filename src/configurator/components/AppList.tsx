import {
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Link,
  TableCellLayout,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import { FolderRegular } from "@fluentui/react-icons";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import {
  allAppItems,
  configurationWebSP,
  selectedAppItem,
  updateApp,
} from "../runtimeStore";
import {
  getEnabledAppCollection,
  updateAppCollection,
} from "../services/appCollection";
import { AppCollectionActivator } from "./AppCollectionActivator";
import { DebugPopup } from "./DebugPopup";
import { DeleteApp } from "./DeleteApp";

async function updateCollection(
  app: AppCollectionConfigurationItem,
  enabled: boolean
) {
  const dataOnServer = await getEnabledAppCollection(configurationWebSP);
  const isEnabledOnServer = dataOnServer.data.includes(app.name);
  if (enabled !== isEnabledOnServer) {
    const apps = [...dataOnServer.data];
    if (enabled) {
      apps.push(app.name);
    } else {
      apps.splice(apps.indexOf(app.name), 1);
    }
    await updateAppCollection(configurationWebSP, apps);
  }
  app.activated = enabled;
  updateApp(app);
}

const columns: TableColumnDefinition<AppCollectionConfigurationItem>[] = [
  createTableColumn<AppCollectionConfigurationItem>({
    columnId: "appCollection",
    renderHeaderCell: () => {
      return "App Collection Name";
    },
    renderCell: (item) => {
      return (
        <TableCellLayout media={<FolderRegular />}>
          <Link
            onClick={() => {
              selectedAppItem.value = JSON.parse(JSON.stringify(item));
            }}
          >
            {item.name}
          </Link>
        </TableCellLayout>
      );
    },
  }),

  createTableColumn<AppCollectionConfigurationItem>({
    columnId: "activated",
    renderHeaderCell: () => {
      return "Activated";
    },
    renderCell: (item) => {
      return <AppCollectionActivator app={item} onChange={updateCollection} />;
    },
  }),

  createTableColumn<AppCollectionConfigurationItem>({
    columnId: "inDebug",
    renderHeaderCell: () => {
      return "In debug";
    },
    renderCell: (item) => {
      return <DebugPopup app={item} />;
    },
  }),
  createTableColumn<AppCollectionConfigurationItem>({
    columnId: "deleteAppColl",
    renderHeaderCell: () => {
      return "";
    },
    renderCell: (item) => {
      return <DeleteApp item={item} />;
    },
  }),
];
interface ApplistProps {}
export function AppList({}: ApplistProps) {
  // const apps: AppsItem[] = [];

  return (
    <>
      <DataGrid
        items={allAppItems.value}
        columns={columns}
        style={{ minWidth: "550px" }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<AppCollectionConfigurationItem>>
          {({ item, rowId }) => (
            <DataGridRow<AppCollectionConfigurationItem> key={rowId}>
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </>
  );
}
