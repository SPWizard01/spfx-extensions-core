import { Body1, Button, Switch } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import type { ComponentChild } from "preact";
import type { SPFxExtensionUrlMapItem } from "../../../models/appCollectionManifest";
import type { CollectionEventWebData } from "../../models/eventData";
import { GetBadge } from "./Badges";
import { Stack } from "./Stack";

interface WebsProps {
  webs: SPFxExtensionUrlMapItem[];
  control: "switch" | "delete";
  onControlClick?: (data: CollectionEventWebData) => void;
  additionalIcon?: ComponentChild;
  style?: React.CSSProperties;
}

export function Webs({ webs, control, onControlClick, additionalIcon, style }: WebsProps) {
  if (webs.length === 0) {
    return null;
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
            <Body1>{subSite.url}</Body1>
          </Stack>
          {control === "switch" ? (
            <Switch
              onChange={(_e, data) => {
                onControlClick?.({
                  controlType: "switch",
                  item: subSite,
                  itemType: "web",
                  data: data.checked,
                });
              }}
            />
          ) : (
            <Button
              onClick={() =>
                onControlClick?.({
                  controlType: "delete",
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
