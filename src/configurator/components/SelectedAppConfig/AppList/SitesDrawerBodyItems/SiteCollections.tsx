import { Body1, Divider, Subtitle2, Switch } from "@fluentui/react-components";
import { ArrowTurnDownRightRegular } from "@fluentui/react-icons";
import { Stack } from "../../../common/Stack";
import type { UrlSiteCollection } from "../ManageAppDefinitionMapItemDrawer";
import { GetBadge } from "./Badges";

interface SiteCollectionsProps {
  siteCollections: UrlSiteCollection[];
}

export default function SiteCollections({
  siteCollections,
}: SiteCollectionsProps) {
  return (
    <Stack gap={8}>
      <Subtitle2 style={{ marginBottom: "8px" }}>Site collections</Subtitle2>
      <Stack gap={8}>
        <Divider />
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
                  {GetBadge("warning", "Site collection")}
                  {site.url}
                </Stack>
                {/* TODO Enable for all site collection subsites */}
                <Switch />
              </Stack>

              {site.webs.map((subSite) => (
                <Stack
                  horizontal
                  horizontalAlign="space-between"
                  verticalAlign="center"
                >
                  <Stack horizontal gap={8} verticalAlign="center">
                    <ArrowTurnDownRightRegular />
                    {GetBadge(undefined, "Web", "64px")}
                    <Body1>{subSite.url.split(site.url)[1] || "/"}</Body1>
                  </Stack>
                  {/* TODO include/exclude separate site */}
                  <Switch />
                </Stack>
              ))}
            </Stack>
            <Divider />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
