import { Body1, Divider, Subtitle2, Switch } from "@fluentui/react-components";
import { ArrowRightRegular } from "@fluentui/react-icons";

import { Stack } from "../../../common/Stack";
import type { UrlSiteCollection } from "../ManageAppDefinitionMapItemDrawer";
import { GetBadge } from "./Badges";

interface WebsProps {
  webs: UrlSiteCollection[];
}

export default function Webs({ webs }: WebsProps) {
  return (
    <Stack gap={8}>
      <Subtitle2 style={{ marginBottom: "8px" }}>Webs</Subtitle2>
      <Stack gap={8}>
        <Divider />
        {webs.map((subSite) => (
          <Stack
            horizontal
            horizontalAlign="space-between"
            verticalAlign="center"
          >
            <Stack horizontal gap={8} verticalAlign="center">
              <ArrowRightRegular />
              {GetBadge(undefined, "Web", "64px")}
              <Body1>{subSite.url}</Body1>
            </Stack>
            <Switch />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
