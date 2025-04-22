import { Body1, Button, Switch } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import type { ComponentChild } from "preact";
import type { SPFxExtensionUrlMapItem } from "../../../models/appCollectionManifest";
import { cloneObject } from "../../../utilities/helpers";
import type { CollectionEventWebData } from "../../models/eventData";
import { selectedAppDefinitionItem } from "../../runtimeStore";
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
    if (!selectedAppDefinitionItem.value) {
      return;
    }
    const copy = cloneObject(selectedAppDefinitionItem.value);
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
    selectedAppDefinitionItem.value = copy;
  }

  function getSwitchCheckedForWeb(subSite: SPFxExtensionUrlMapItem) {
    if (!selectedAppDefinitionItem.value) {
      return false;
    }
    if (selectedAppDefinitionItem.value.config.enabledEverywhere) {
      return !selectedAppDefinitionItem.value.config.excludedIds.includes(
        subSite.id
      );
    }
    return selectedAppDefinitionItem.value.config.includedIds.includes(
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
