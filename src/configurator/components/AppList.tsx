import {
  Button,
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableCellLayout,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import { FolderRegular } from "@fluentui/react-icons";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";
import { DEBUG_KEYS } from "../../utilities/debug";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import { allAppItems, configurationWebSP } from "../runtimeStore";
import {
  getAllAppCollections,
  getEnabledAppCollection,
  updateAppCollection,
} from "../services/appCollection";
import { AppCollectionActivated } from "./AppCollectionActivated";
import { DebugPopup } from "./DebugPopup";
import { ManifestModal } from "./ManifestModal";

async function updateApp(
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
  const allApps = [...allAppItems.value];
  const itemIdx = allApps.findIndex((w) => w.name === app.name);
  if (itemIdx > -1) {
    allApps.splice(itemIdx, 1, app);
  } else {
    allApps.push(app);
  }
  allAppItems.value = [...allApps];
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
          <ManifestModal app={item} />
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
      return <AppCollectionActivated app={item} onChange={updateApp} />;
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
];
interface ApplistProps {}
export function AppList({}: ApplistProps) {
  // const apps: AppsItem[] = [];
  useSignals();

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
