import {
  Checkbox,
  createTableColumn,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Switch,
  TableCellLayout,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import { FolderRegular } from '@fluentui/react-icons';
import { DEBUG_KEYS } from '../../utilities/debug';
import {
  configurationWebAppCollection,
  configurationWebEnabledAppCollections,
} from '../runtimeStore';
import { ManifestModal } from './ManifestModal';

interface AppsItem {
  name: string;
  enabled: boolean;
  inDebug: boolean;
}

const apps = configurationWebAppCollection.map<AppsItem>((app) => ({
  name: app,
  enabled: configurationWebEnabledAppCollections.data.includes(app),
  inDebug: Number(localStorage.getItem(`${DEBUG_KEYS.SPFXEXT}_${app}`)) > 0,
}));

const columns: TableColumnDefinition<AppsItem>[] = [
  createTableColumn<AppsItem>({
    columnId: 'appCollection',
    renderHeaderCell: () => {
      return 'App Collection Name';
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
    columnId: 'enabled',
    renderHeaderCell: () => {
      return 'Enabled';
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>
          <Switch defaultChecked={item.enabled} />
        </TableCellLayout>
      );
    },
  }),

  createTableColumn<AppsItem>({
    columnId: 'inDebug',
    renderHeaderCell: () => {
      return 'In debug';
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>
          <Checkbox disabled defaultChecked={item.inDebug} />
        </TableCellLayout>
      );
    },
  }),
];

export function AppList() {
  return (
    <DataGrid items={apps} columns={columns} style={{ minWidth: '550px' }}>
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
  );
}
