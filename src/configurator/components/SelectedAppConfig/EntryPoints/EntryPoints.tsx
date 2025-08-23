import {
  Body1,
  Button,
  Link,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Subtitle2,
  Switch,
  Text,
  type PositioningImperativeRef,
} from "@fluentui/react-components";
import { Info16Regular, Javascript24Regular } from "@fluentui/react-icons";
import { signal } from "@preact/signals";
import { useCallback, useRef } from "preact/hooks";
import {
  selectedAppItem,
  selectedAppJSFiles,
  updateSelectedApp,
  uploadProjectDrawerOpen,
} from "../../../runtimeStore";
import { Stack } from "../../common/Stack";
import { UploadProjectDrawer } from "./UploadProjectDrawer";

export function EntryPoints() {
  const app = selectedAppItem.value;

  const positioningRef = useRef<PositioningImperativeRef>(null);
  const switchRef = useCallback(
    (el: HTMLButtonElement | null) => {
      positioningRef.current?.setTarget(el);
    },
    [positioningRef]
  );

  if (!app) return null;
  return (
    <>
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        style={{
          borderBottom: "1px solid #eaeaea",
          paddingBottom: "10px",
        }}
      >
        <Subtitle2>Entry points</Subtitle2>
        <Stack horizontal verticalAlign="center">
          <Popover positioning={{ positioningRef }} withArrow>
            <PopoverTrigger disableButtonEnhancement>
              <Link>
                <Info16Regular />
              </Link>
            </PopoverTrigger>
            <PopoverSurface tabIndex={-1}>
              <Body1>
                <Text>
                  Select files that export an array of <i>SPFxExtensionAppRegistration</i> as
                  default export.
                </Text>
              </Body1>
            </PopoverSurface>
          </Popover>
        </Stack>
      </Stack>
      {selectedAppJSFiles.value
        .filter((jsFile) =>
          app!.manifest.appRelativeEntryPointUrls.some((selected) => jsFile === selected)
        )
        .map((ep) => (
          <Stack horizontal gap={4} verticalAlign="center">
            <Javascript24Regular /> {ep}
          </Stack>
        ))}
      <Button
        onClick={() => {
          uploadProjectDrawerOpen.value = true;
        }}
      >
        Upload / Edit
      </Button>
      <UploadProjectDrawer jsFiles={selectedAppJSFiles.value} />
    </>
  );
}
