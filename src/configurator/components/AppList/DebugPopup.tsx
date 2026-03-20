import {
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
} from "@fluentui/react-components";
import { useState } from "preact/hooks";
import { appIsInDebug } from "../../../utilities/debug";
import { DEBUG_KEY_APP_PREFIX } from "../../../utilities/runtimeConstants";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";

interface DebugPopupProps {
  app: AppCollectionConfigurationItem;
}

export function DebugPopup({ app }: DebugPopupProps) {
  const [port, setPort] = useState(
    window.localStorage.getItem(`${DEBUG_KEY_APP_PREFIX}${app.name}`) ?? ""
  );
  const [popoverOpen, setOpen] = useState(false);
  return (
    <Popover positioning={"after"} open={popoverOpen}>
      <PopoverTrigger disableButtonEnhancement>
        <Checkbox
          checked={appIsInDebug(app.name)}
          onChange={() => {
            setOpen(!popoverOpen);
          }}
        />
      </PopoverTrigger>

      <PopoverSurface tabIndex={-1}>
        <Input
          defaultValue={port}
          onChange={(_, data) => {
            setPort(data.value);
          }}
        />
        <Button
          appearance="primary"
          onClick={() => {
            window.localStorage.setItem(`${DEBUG_KEY_APP_PREFIX}${app.name}`, port);
            setOpen(false);
          }}
        >
          Save
        </Button>
      </PopoverSurface>
    </Popover>
  );
}
