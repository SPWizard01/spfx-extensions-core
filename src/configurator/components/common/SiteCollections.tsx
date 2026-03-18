import { Button, Switch } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import type { ComponentChild } from "preact";
import { cloneObject } from "../../../utilities/helpers";
import type { CollectionEventSiteData } from "../../models/eventData";
import type { SiteUrlCollectionItem } from "../../models/StructureModels";
import { selectedAppDefinitionItem } from "../../runtimeStore";
import { GetBadge } from "./Badges";
import { Stack } from "./Stack";
import { Webs } from "./Webs";

interface SiteCollectionsProps {
  siteCollections: SiteUrlCollectionItem[];
  control: "switch" | "delete";
  onDeleteClick?: (data: CollectionEventSiteData) => void;
  additionalIcon?: ComponentChild;
  disableControl?: boolean;
}

export function SiteCollections({
  siteCollections,
  control,
  onDeleteClick,
  additionalIcon,
  disableControl,
}: SiteCollectionsProps) {
  function setConfigurationForSite(
    siteItem: SiteUrlCollectionItem,
    checked: boolean
  ) {
    if (!selectedAppDefinitionItem.value) {
      return;
    }
    const copy = cloneObject(selectedAppDefinitionItem.value);
    const exIds = copy.config.excludedIds.filter(
      (a) => !siteItem.webs.some((w) => w.id === a) && siteItem.siteId !== a
    );

    const inIds = copy.config.includedIds.filter(
      (a) => !siteItem.webs.some((w) => w.id === a) && siteItem.siteId !== a
    );

    if (!copy.config.enabledEverywhere && checked) {
      inIds.push(siteItem.siteId);
    }
    if (copy.config.enabledEverywhere && !checked) {
      exIds.push(siteItem.siteId);
    }
    copy.config.excludedIds = exIds;
    copy.config.includedIds = inIds;
    selectedAppDefinitionItem.value = copy;
  }
  return (
    <>
      {siteCollections.map((site) => (
        <Stack>
          <Stack
            horizontal
            style={{ minHeight: "36px" }}
            verticalAlign="center"
            horizontalAlign="space-between"
          >
            <Stack horizontal verticalAlign="center" gap={8}>
              {GetBadge("warning", "Site")}
              {site.url}
            </Stack>
            {/* TODO Enable for all site collection subsites */}
            {control === "switch" ? (
              <Switch
                checked={
                  (selectedAppDefinitionItem.value?.config?.enabledEverywhere ||
                    selectedAppDefinitionItem.value?.config?.includedIds?.includes(
                      site.siteId
                    )) &&
                  !selectedAppDefinitionItem.value?.config?.excludedIds?.includes(
                    site.siteId
                  )
                }
                disabled={disableControl}
                onChange={(_e, data) => {
                  setConfigurationForSite(site, data.checked);
                }}
              />
            ) : (
              <Button
                onClick={() =>
                  onDeleteClick?.({
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
            control={control}
            onDeleteClick={onDeleteClick}
            additionalIcon={additionalIcon}
            disableControl={
              disableControl ||
              selectedAppDefinitionItem.value?.config.excludedIds.includes(
                site.siteId
              ) ||
              selectedAppDefinitionItem.value?.config.includedIds.includes(
                site.siteId
              )
            }
          />
        </Stack>
      ))}
    </>
  );
}
