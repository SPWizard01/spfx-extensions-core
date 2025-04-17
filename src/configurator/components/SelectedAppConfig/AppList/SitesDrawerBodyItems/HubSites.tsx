import { Body1, Divider, Subtitle2, Switch } from "@fluentui/react-components";
import {
  ArrowRightRegular,
  ArrowTurnDownRightRegular,
} from "@fluentui/react-icons";
import { Stack } from "../../../common/Stack";
import { StackItem } from "../../../common/StackItem";
import type { UrlHubCollection } from "../ManageAppDefinitionMapItemDrawer";
import { GetBadge } from "./Badges";

interface HubSitesProps {
  hubSites: UrlHubCollection[];
}

export default function HubSites({ hubSites }: HubSitesProps) {
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
                  <Switch
                    onChange={(_, data) => {
                      //TODO
                      console.log(
                        "Turn on for ALL HUB SITE COLLECTION AND HUB CHILDS",
                        data
                      );
                    }}
                  />
                </Stack>
                {hubRoot.sites.map((site) => {
                  return (
                    <>
                      <Stack
                        horizontal
                        gap={8}
                        verticalAlign="center"
                        horizontalAlign="space-between"
                      >
                        <Stack horizontal verticalAlign="center" gap={8}>
                          <ArrowTurnDownRightRegular />
                          {GetBadge("warning", "Site collection")}
                          {site.url}
                        </Stack>
                        <Switch
                          onChange={(_, data) => {
                            //TODO
                            console.log(
                              "Turn on for ALL SITE COLLECTION ROOT HUB",
                              data
                            );
                          }}
                        />
                      </Stack>
                      {site.webs.map((subSite) => (
                        <Stack
                          horizontal
                          horizontalAlign="space-between"
                          verticalAlign="center"
                          style={{ paddingLeft: "24px " }}
                        >
                          <Stack horizontal gap={8} verticalAlign="center">
                            <ArrowTurnDownRightRegular />
                            {GetBadge(undefined, "Web", "64px")}
                            <Body1>{subSite.url}</Body1>
                          </Stack>
                          <Switch />
                        </Stack>
                      ))}
                    </>
                  );
                })}
                {hubRoot.webs.map((subSite) => (
                  <Stack
                    horizontal
                    horizontalAlign="space-between"
                    verticalAlign="center"
                  >
                    <Stack horizontal gap={8} verticalAlign="center">
                      <ArrowRightRegular />
                      {GetBadge(undefined, "Web", "88px")}
                      <Body1>{subSite.url}</Body1>
                    </Stack>
                    <Switch />
                  </Stack>
                ))}{" "}
              </StackItem>
              <Divider />
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
