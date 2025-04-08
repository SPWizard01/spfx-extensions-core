import { Switch } from "@fluentui/react-components";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";

interface AppEnabledProps {
  app: AppCollectionConfigurationItem;
  onChange?: (
    appItem: AppCollectionConfigurationItem,
    enabled: boolean
  ) => void;
}
export function AppCollectionActivator({ app, onChange }: AppEnabledProps) {
  return (
    <Switch
      defaultChecked={app.activated}
      onChange={(_, data) => {
        onChange?.(app, data.checked);
      }}
    />
  );
}
