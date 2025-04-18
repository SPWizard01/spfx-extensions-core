import { Button, Divider, Switch } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import type { ComponentChild } from "preact";
import type { CollectionEventSiteData } from "../../models/eventData";
import type { SiteUrlCollectionItem } from "../../models/UrlCollectionMapItem";
import { GetBadge } from "./Badges";
import { Stack } from "./Stack";
import { Webs } from "./Webs";

interface SiteCollectionsProps {
  siteCollections: SiteUrlCollectionItem[];
  control: "switch" | "delete";
  onControlClick?: (data: CollectionEventSiteData) => void;
  additionalIcon?: ComponentChild;
}

export function SiteCollections({
  siteCollections,
  control,
  onControlClick,
  additionalIcon,
}: SiteCollectionsProps) {
  return (
    <>
      {siteCollections.map((site) => (
        <Stack gap={8}>
          <Stack>
            <Stack
              horizontal
              gap={8}
              verticalAlign="center"
              horizontalAlign="space-between"
            >
              <Stack horizontal verticalAlign="center" gap={8}>
                {additionalIcon}
                {GetBadge("warning", "Site collection")}
                {site.url}
              </Stack>
              {/* TODO Enable for all site collection subsites */}
              {control === "switch" ? (
                <Switch
                  onChange={(_e, data) => {
                    onControlClick?.({
                      controlType: "switch",
                      item: site,
                      itemType: "site",
                      data: data.checked,
                    });
                  }}
                />
              ) : (
                <Button
                  onClick={() =>
                    onControlClick?.({
                      controlType: "delete",
                      item: site,
                      itemType: "site",
                    })
                  }
                  icon={<Delete16Regular />}
                />
              )}
            </Stack>

            <Webs
              webs={site.webs}
              control="switch"
              onControlClick={onControlClick}
              additionalIcon={additionalIcon}
              style={{ paddingLeft: "24px " }}
            />
          </Stack>
          <Divider />
        </Stack>
      ))}
    </>
  );
}
