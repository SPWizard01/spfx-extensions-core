import { Button, Divider, Subtitle2, Switch } from "@fluentui/react-components";
import {
  ArrowRightRegular,
  ArrowTurnDownRightRegular,
  Delete16Regular,
} from "@fluentui/react-icons";
import { useState } from "preact/hooks";
import type { CollectionEventHubData } from "../../models/eventData";
import type { HubUrlCollectionItem } from "../../models/UrlCollectionMapItem";
import { GetBadge } from "./Badges";
import { SiteCollections } from "./SiteCollections";
import { Stack } from "./Stack";
import { StackItem } from "./StackItem";
import { Webs } from "./Webs";

interface HubSitesProps {
  hubSites: HubUrlCollectionItem[];
  control: "switch" | "delete";
  onControlClick?: (data: CollectionEventHubData) => void;
  disableControl?: boolean;
}

export function HubSites({ hubSites, onControlClick, control, disableControl }: HubSitesProps) {
  const [sitesDisabled, setSitesDisabled] = useState(disableControl);
  function onSwitchChange(data: boolean) {
    setSitesDisabled(data);
  }
  return (
    <Stack gap={8}>
      <Subtitle2 style={{ marginBottom: "8px" }}>Hub sites</Subtitle2>
      <Stack gap={8}>
        <Divider />
        {hubSites.map((hubRoot) => {
          return (
            <Stack gap={8}>
              <StackItem>
                <Stack
                  horizontal
                  gap={8}
                  verticalAlign="center"
                  horizontalAlign="space-between"
                >
                  <Stack horizontal verticalAlign="center" gap={8}>
                    {GetBadge("success", "Hub", "110px")}
                    {hubRoot.url}
                  </Stack>
                  {control === "switch" ? (
                    <Switch
                      onChange={(_e, data) => {
                        onControlClick?.({
                          controlType: "switch",
                          item: hubRoot,
                          itemType: "hub",
                          data: data.checked,
                        });
                        onSwitchChange(data.checked);
                      }}
                    />
                  ) : (
                    <Button
                      onClick={() =>
                        onControlClick?.({
                          controlType: "delete",
                          item: hubRoot,
                          itemType: "hub",
                        })
                      }
                      icon={<Delete16Regular />}
                    />
                  )}
                </Stack>
                <SiteCollections
                  control="switch"
                  siteCollections={hubRoot.sites}
                  onControlClick={onControlClick}
                  additionalIcon={<ArrowTurnDownRightRegular />}
                  disableControl={disableControl || sitesDisabled}
                />
                <Webs
                  control="switch"
                  webs={hubRoot.webs}
                  onControlClick={onControlClick}
                  additionalIcon={<ArrowRightRegular />}
                  disableControl={disableControl || sitesDisabled}
                />
              </StackItem>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
