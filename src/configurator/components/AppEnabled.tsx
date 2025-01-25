import { Switch, TableCellLayout } from "@fluentui/react-components";
import type { AppsItem } from "../models/appsItem";

interface AppEnabledProps {
  app: AppsItem;
  onChange?: (appItem: AppsItem, enabled: boolean) => void;
}
export function AppEnabled({ app, onChange }: AppEnabledProps) {
  return (
    <TableCellLayout>
      <Switch
        defaultChecked={app.enabled}
        onChange={(_, data) => {
          onChange?.(app, data.checked);
        }}
      />
    </TableCellLayout>
  );
}
