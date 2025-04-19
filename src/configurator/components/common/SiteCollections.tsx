import { Button, Divider, Switch } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import type { ComponentChild } from "preact";
import type { SPFxExtensionAppDefinitionMapItem } from "../../../models/appFolderManifest";
import type { CollectionEventSiteData } from "../../models/eventData";
import type { SiteUrlCollectionItem } from "../../models/StructureModels";
import { selectedAppDeinitionMapItem } from "../../runtimeStore";
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
    if (!selectedAppDeinitionMapItem.value) {
      return;
    }
    const copy: SPFxExtensionAppDefinitionMapItem = JSON.parse(
      JSON.stringify(selectedAppDeinitionMapItem.value)
    );

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
    selectedAppDeinitionMapItem.value = copy;
  }
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
                  checked={
                    (selectedAppDeinitionMapItem.value?.config
                      ?.enabledEverywhere ||
                      selectedAppDeinitionMapItem.value?.config?.includedIds?.includes(
                        site.siteId
                      )) &&
                    !selectedAppDeinitionMapItem.value?.config?.excludedIds?.includes(
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
              style={{ paddingLeft: "24px" }}
              disableControl={
                disableControl ||
                selectedAppDeinitionMapItem.value?.config.excludedIds.includes(
                  site.siteId
                ) ||
                selectedAppDeinitionMapItem.value?.config.includedIds.includes(
                  site.siteId
                )
              }
            />
          </Stack>
          <Divider />
        </Stack>
      ))}
    </>
  );
}
