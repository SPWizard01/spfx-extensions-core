import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Toolbar,
  ToolbarButton,
} from "@fluentui/react-components";
import {
  FolderRegular,
  WebAsset16Regular,
} from "@fluentui/react-icons";
import { cloneObject } from "../../../utilities/helpers";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import {
  allAppItems,
  configurationIsGlobal,
  configurationWebSP,
  getConfigurationWebIsRootHub,
  selectedAppItem,
  updateApp,
} from "../../runtimeStore";
import {
  getAppCollectionConfig,
  updateAppCollectionConfig,
} from "../../services/appCollection";
import { Stack } from "../common/Stack";
import { AddAppCollection } from "./AddAppCollection";
import { AppCollectionActivator } from "./AppCollectionActivator";
import { DebugPopup } from "./DebugPopup";
import { DeleteApp } from "./DeleteApp";
import { ManageSitesDrawerSignal } from "./ManageSitesDrawer";

async function updateCollection(
  app: AppCollectionConfigurationItem,
  enabled: boolean
) {
  const dataOnServer = await getAppCollectionConfig(configurationWebSP);
  const isEnabledOnServer = dataOnServer.data.enabledAppCollections.includes(
    app.name
  );
  if (enabled !== isEnabledOnServer) {
    if (enabled) {
      dataOnServer.data.enabledAppCollections.push(app.name);
    } else {
      dataOnServer.data.enabledAppCollections.splice(
        dataOnServer.data.enabledAppCollections.indexOf(app.name),
        1
      );
    }
    await updateAppCollectionConfig(configurationWebSP, dataOnServer.data);
  }
  app.activated = enabled;
  updateApp(app);
}
const columns = [
  {
    columnId: "name",
    text: "App Collection",
  },
  {
    columnId: "enabled",
    text: "Enabled",
  },
  {
    columnId: "InDebug",
    text: "In Debug",
  },
  {
    columnId: "Delete",
    text: "",
  },
];
interface ApplistProps {
  unused?: boolean;
}

export function AppList(_props: ApplistProps) {
  if (selectedAppItem.value) return null;
  return (
    <Stack gap={16}>
      <Toolbar>
        <Stack gap={8} horizontal>
          <AddAppCollection />
          {configurationIsGlobal || getConfigurationWebIsRootHub() ? (
            <ToolbarButton
              appearance="secondary"
              onClick={() => {
                ManageSitesDrawerSignal.value = true;
              }}
              icon={<WebAsset16Regular />}
            >
              Manage sites
            </ToolbarButton>
          ) : null}
        </Stack>
      </Toolbar>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHeaderCell key={column.columnId}>
                {column.text}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {allAppItems.value.map((item) => (
            <TableRow key={item.name}>
              <TableCell>
                <TableCellLayout media={<FolderRegular />}>
                  <Link
                    onClick={() => {
                      selectedAppItem.value = cloneObject(item);
                    }}
                  >
                    {item.name}
                  </Link>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <AppCollectionActivator
                    app={item}
                    onChange={updateCollection}
                  />
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <DebugPopup app={item} />
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <DeleteApp item={item} />
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
