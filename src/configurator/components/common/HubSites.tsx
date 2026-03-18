import { Button, Switch } from "@fluentui/react-components";
import {
  ArrowRightRegular,
  ArrowTurnDownRightRegular,
  Delete16Regular,
} from "@fluentui/react-icons";
import { cloneObject } from "../../../utilities/helpers";
import type { CollectionEventHubData } from "../../models/eventData";
import type { HubUrlCollectionItem } from "../../models/StructureModels";
import { selectedAppDefinitionItem } from "../../runtimeStore";
import { GetBadge } from "./Badges";
import { SiteCollections } from "./SiteCollections";
import { Stack } from "./Stack";
import { Webs } from "./Webs";

interface HubSitesProps {
  hubSites: HubUrlCollectionItem[];
  control: "switch" | "delete";
  onDeleteClick?: (data: CollectionEventHubData) => void;
  disableControl?: boolean;
}

export function HubSites({ hubSites, onDeleteClick, control }: HubSitesProps) {
  function setConfigurationForHub(
    hubItem: HubUrlCollectionItem,
    checked: boolean
  ) {
    if (!selectedAppDefinitionItem.value) {
      return;
    }
    const copy = cloneObject(selectedAppDefinitionItem.value);

    function notThisHubItems(urlMapItemId: string) {
      //webs do not contain this itemid
      const notThisHubWebs = !hubItem.webs.some(
        (w) => w.id === urlMapItemId || w.hubid === urlMapItemId
      );
      //sites do not contain this itemid
      const notThisHubSites = !hubItem.sites.some(
        (s) => s.id === urlMapItemId || s.hubid === urlMapItemId
      );
      //subsites do not contain this itemid
      const notThisHubSiteWebs = !hubItem.sites.some((s) =>
        s.webs.some((w) => w.id === urlMapItemId || w.hubid === urlMapItemId)
      );
      const notThisHub =
        hubItem.hubid !== urlMapItemId && hubItem.siteId !== urlMapItemId;
      return (
        notThisHubWebs && notThisHubSites && notThisHubSiteWebs && notThisHub
      );
    }

    const exIds = copy.config.excludedIds.filter(notThisHubItems);
    const exHubIds = copy.config.excludedHubIds.filter(notThisHubItems);
    const inIds = copy.config.includedIds.filter(notThisHubItems);
    const inHubIds = copy.config.includedHubIds.filter(notThisHubItems);

    if (!copy.config.enabledEverywhere && checked) {
      inHubIds.push(hubItem.hubid);
    }
    if (copy.config.enabledEverywhere && !checked) {
      exHubIds.push(hubItem.hubid);
    }
    copy.config.excludedIds = exIds;
    copy.config.excludedHubIds = exHubIds;
    copy.config.includedIds = inIds;
    copy.config.includedHubIds = inHubIds;
    selectedAppDefinitionItem.value = copy;
  }
  return (
    <>
      {hubSites.map((hubRoot) => (
        <Stack>
          <Stack
            horizontal
            verticalAlign="center"
            horizontalAlign="space-between"
          >
            <Stack
              horizontal
              gap={8}
              verticalAlign="center"
              style={{ height: "36px" }}
            >
              {GetBadge("success", "Hub")}
              {hubRoot.url}
            </Stack>
            {control === "switch" ? (
              <Switch
                checked={
                  (selectedAppDefinitionItem.value?.config?.enabledEverywhere ||
                    selectedAppDefinitionItem.value?.config?.includedHubIds?.includes(
                      hubRoot.hubid
                    )) &&
                  !selectedAppDefinitionItem.value?.config?.excludedHubIds?.includes(
                    hubRoot.hubid
                  )
                }
                onChange={(_e, data) => {
                  setConfigurationForHub(hubRoot, data.checked);
                }}
              />
            ) : (
              <Button
                onClick={() =>
                  onDeleteClick?.({
                    item: hubRoot,
                    itemType: "hub",
                  })
                }
                icon={<Delete16Regular />}
              />
            )}
          </Stack>
          <SiteCollections
            control={control}
            siteCollections={hubRoot.sites}
            onDeleteClick={onDeleteClick}
            additionalIcon={<ArrowTurnDownRightRegular />}
            disableControl={
              selectedAppDefinitionItem.value?.config.excludedHubIds.includes(
                hubRoot.hubid
              ) ||
              selectedAppDefinitionItem.value?.config.includedHubIds.includes(
                hubRoot.hubid
              )
            }
          />
          <Webs
            control={control}
            webs={hubRoot.webs}
            onDeleteClick={onDeleteClick}
            additionalIcon={<ArrowRightRegular />}
            disableControl={
              selectedAppDefinitionItem.value?.config.excludedHubIds.includes(
                hubRoot.hubid
              ) ||
              selectedAppDefinitionItem.value?.config.includedHubIds.includes(
                hubRoot.hubid
              )
            }
          />
        </Stack>
      ))}
    </>
  );
}
