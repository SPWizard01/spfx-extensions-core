import { Body1, Button, Switch } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import type { ComponentChild } from "preact";
import type { SPFxExtensionUrlMapItem } from "../../../models/appCollectionManifest";
import type { SPFxExtensionAppDefinitionMapItem } from "../../../models/appFolderManifest";
import type { CollectionEventWebData } from "../../models/eventData";
import { selectedAppDeinitionMapItem } from "../../runtimeStore";
import { GetBadge } from "./Badges";
import { Stack } from "./Stack";

interface WebsProps {
  webs: SPFxExtensionUrlMapItem[];
  control: "switch" | "delete";
  onDeleteClick?: (data: CollectionEventWebData) => void;
  additionalIcon?: ComponentChild;
  style?: React.CSSProperties;
  disableControl?: boolean;
}

export function Webs({
  webs,
  control,
  onDeleteClick,
  additionalIcon,
  style,
  disableControl,
}: WebsProps) {
  if (webs.length === 0) {
    return null;
  }
  function setConfigurationForWeb(
    webItem: SPFxExtensionUrlMapItem,
    checked: boolean
  ) {
    if (!selectedAppDeinitionMapItem.value) {
      return;
    }
    const copy: SPFxExtensionAppDefinitionMapItem = JSON.parse(
      JSON.stringify(selectedAppDeinitionMapItem.value)
    );
    const exIds = copy.config.excludedIds.filter((a) => webItem.id !== a);

    const exHubIds = copy.config.excludedHubIds.filter((a) => webItem.id !== a);

    const inIds = copy.config.includedIds.filter((a) => webItem.id !== a);
    const inHubIds = copy.config.includedHubIds.filter((a) => webItem.id !== a);

    if (!copy.config.enabledEverywhere && checked) {
      inIds.push(webItem.id);
    }
    if (copy.config.enabledEverywhere && !checked) {
      exIds.push(webItem.id);
    }
    copy.config.excludedIds = exIds;
    copy.config.excludedHubIds = exHubIds;
    copy.config.includedIds = inIds;
    copy.config.includedHubIds = inHubIds;
    selectedAppDeinitionMapItem.value = copy;
  }

  function getSwitchCheckedForWeb(subSite: SPFxExtensionUrlMapItem) {
    if (!selectedAppDeinitionMapItem.value) {
      return false;
    }
    if (selectedAppDeinitionMapItem.value.config.enabledEverywhere) {
      return !selectedAppDeinitionMapItem.value.config.excludedIds.includes(
        subSite.id
      );
    }
    return selectedAppDeinitionMapItem.value.config.includedIds.includes(
      subSite.id
    );
  }

  return (
    <>
      {webs.map((subSite) => (
        <Stack
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
          style={style}
        >
          <Stack horizontal gap={8} verticalAlign="center">
            {additionalIcon}
            {GetBadge(undefined, "Web", "64px")}
            <Body1>{`${subSite.url}`}</Body1>
          </Stack>
          {control === "switch" ? (
            <Switch
              disabled={disableControl}
              onChange={(_e, data) => {
                setConfigurationForWeb(subSite, data.checked);
              }}
              checked={getSwitchCheckedForWeb(subSite)}
            />
          ) : (
            <Button
              onClick={() =>
                onDeleteClick?.({
                  item: subSite,
                  itemType: "web",
                })
              }
              icon={<Delete16Regular />}
            />
          )}
        </Stack>
      ))}
    </>
  );
}
