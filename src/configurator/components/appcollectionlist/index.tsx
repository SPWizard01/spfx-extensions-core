import {
  Avatar,
  Link,
  type PresenceBadgeStatus,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import {
  DocumentPdfRegular,
  DocumentRegular,
  EditRegular,
  FolderRegular,
  OpenRegular,
  PeopleRegular,
  VideoRegular,
} from "@fluentui/react-icons";
import { DEBUG_KEYS } from "../../../utilities/debug";
import {
  getAllAppCollections,
  getEnabledAppCollection,
} from "../../services/appCollection";
import { getConfigurationSP } from "../../services/pnpService";
import { ManifestModal } from "../manifestmodal";
const sp = getConfigurationSP();
const allApps = await getAllAppCollections(sp);
const enabledApps = await getEnabledAppCollection(sp);

const apps = allApps.map((app) => ({
  appCollection: {
    name: app,
    icon: <FolderRegular />,
  },
  enabled: enabledApps.data.includes(app),
  inDebug: Number(localStorage.getItem(`${DEBUG_KEYS.SPFXEXT}_${app}`)) > 0,
}));

const items = [
  {
    file: { label: "Meeting notes", icon: <DocumentRegular /> },
    author: { label: "Max Mustermann", status: "available" },
    lastUpdated: { label: "7h ago", timestamp: 1 },
    lastUpdate: {
      label: "You edited this",
      icon: <EditRegular />,
    },
  },
  {
    file: { label: "Thursday presentation", icon: <FolderRegular /> },
    author: { label: "Erika Mustermann", status: "busy" },
    lastUpdated: { label: "Yesterday at 1:45 PM", timestamp: 2 },
    lastUpdate: {
      label: "You recently opened this",
      icon: <OpenRegular />,
    },
  },
  {
    file: { label: "Training recording", icon: <VideoRegular /> },
    author: { label: "John Doe", status: "away" },
    lastUpdated: { label: "Yesterday at 1:45 PM", timestamp: 2 },
    lastUpdate: {
      label: "You recently opened this",
      icon: <OpenRegular />,
    },
  },
  {
    file: { label: "Purchase order", icon: <DocumentPdfRegular /> },
    author: { label: "Jane Doe", status: "offline" },
    lastUpdated: { label: "Tue at 9:30 AM", timestamp: 3 },
    lastUpdate: {
      label: "You shared this in a Teams chat",
      icon: <PeopleRegular />,
    },
  },
];

const columns = [
  { columnKey: "appCollection", label: "App Collection Name" },
  { columnKey: "enabled", label: "Enabled" },
  { columnKey: "inDebug", label: "In Debug" },
];

export function AppList() {
  return (
    <>
    <Table arial-label="Default table" style={{ minWidth: "510px" }}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell key={column.columnKey}>
              {column.label}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {apps.map((item) => (
          <TableRow key={item.appCollection.name}>
            <TableCell>
              <TableCellLayout media={item.appCollection.icon}>
                <ManifestModal appName={item.appCollection.name} />
              </TableCellLayout>
            </TableCell>
            <TableCell>
              <Switch defaultChecked={item.enabled} />
            </TableCell>
            <TableCell>
              <TableCellLayout>{item.inDebug ? "Yes" : "No"}</TableCellLayout>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </>
  );
}
