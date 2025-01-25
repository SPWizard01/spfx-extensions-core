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
import type { AppsItem } from "../models/appsItem";
import { allAppItems, configurationWebSP, enabledAppCollections } from "../runtimeStore";
import {
  getAllAppCollections,
  getEnabledAppCollection,
  updateAppCollection,
} from "../services/appCollection";
import { AppEnabled } from "./AppEnabled";
import { DebugPopup } from "./DebugPopup";
import { ManifestModal } from "./ManifestModal";

async function updateApp(app: AppsItem, enabled: boolean) {
  const dataOnServer = await getEnabledAppCollection(configurationWebSP);
  const isEnabledOnServer = dataOnServer.data.includes(app.name);
  if (enabled === isEnabledOnServer) {
    return;
  }
  const apps = [...dataOnServer.data];
  if (enabled) {
    apps.push(app.name);
  } else {
    apps.splice(apps.indexOf(app.name), 1);
  }
  await updateAppCollection(configurationWebSP, apps);
  enabledAppCollections.value = apps;
}

const columns: TableColumnDefinition<AppsItem>[] = [
  createTableColumn<AppsItem>({
    columnId: "appCollection",
    renderHeaderCell: () => {
      return "App Collection Name";
    },
    renderCell: (item) => {
      return (
        <TableCellLayout media={<FolderRegular />}>
          <ManifestModal appName={item.name} />
        </TableCellLayout>
      );
    },
  }),

  createTableColumn<AppsItem>({
    columnId: "enabled",
    renderHeaderCell: () => {
      return "Enabled";
    },
    renderCell: (item) => {
      return <AppEnabled app={item} onChange={updateApp} />;
    },
  }),

  createTableColumn<AppsItem>({
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
        <DataGridBody<AppsItem>>
          {({ item, rowId }) => (
            <DataGridRow<AppsItem> key={rowId}>
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
