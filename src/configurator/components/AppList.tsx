import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
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
import { AddApp } from "./AddApp";
import { AppCollectionActivator } from "./AppCollectionActivator";
import { DebugPopup } from "./DebugPopup";
import { DeleteApp } from "./DeleteApp";
import { Stack } from "./Stack";
import { StackItem } from "./StackItem";

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
    <Stack>
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
                      selectedAppItem.value = JSON.parse(JSON.stringify(item));
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
      <StackItem>
        <br />
        <AddApp />
      </StackItem>
    </Stack>
  );
}
