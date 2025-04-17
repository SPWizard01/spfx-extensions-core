import { Button, Input, Subtitle2, Switch } from "@fluentui/react-components";
import { GetRandomCacheStringAsync } from "../../../core/services/browserCache";
import { selectedAppItem, updateSelectedApp } from "../../runtimeStore";
import { Stack } from "../common/Stack";
import { AppDefinitionGrid } from "./AppList/AppDefinitionGrid";
import EntryPoints from "./EntryPoints/EntryPoints";

export function ManifestConfig() {
  const app = selectedAppItem.value;

  if (!app) return null;
  return (
    <Stack horizontal gap={20}>
      <Stack
        gap={16}
        style={{
          paddingBottom: "20px",
          flexBasis: "300px",
          flexShrink: 0,
          paddingRight: "20px",
          borderRight: "1px solid #eaeaea",
        }}
      >
        <EntryPoints />
      </Stack>
      <Stack style={{ flexGrow: 1 }}>
        <Stack
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
          style={{ minHeight: "32px" }}
        >
          <Stack horizontal gap={16} verticalAlign="center">
            <Subtitle2>
              {app.manifest.isESM ? "Applications" : "Entry points"}
            </Subtitle2>
          </Stack>
          <Stack gap={8} horizontal>
            <Switch
              checked={app.manifest.enableCaching}
              label="Enable caching"
              onChange={(_, d) => {
                app.manifest.enableCaching = d.checked;
                updateSelectedApp(app);
              }}
            />

            <Input
              placeholder="Cache string"
              disabled={!app.manifest.enableCaching}
              type="text"
              value={app.manifest.cacheString ?? ""}
              onChange={(_ev, data) => {
                app.manifest.cacheString = data.value;
                updateSelectedApp(app);
              }}
            />
            <Button
              size="medium"
              disabled={!app.manifest.enableCaching}
              onClick={async () => {
                app.manifest.cacheString = await GetRandomCacheStringAsync();
                updateSelectedApp(app);
              }}
            >
              Generate
            </Button>
          </Stack>
        </Stack>
        <AppDefinitionGrid />
      </Stack>
    </Stack>
  );
}
