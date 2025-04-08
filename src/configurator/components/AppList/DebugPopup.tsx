import {
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
} from "@fluentui/react-components";
import { useState } from "react";
import { DEBUG_KEYS, isAppInDebug } from "../../../utilities/debug";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";

interface DebugPopupProps {
  app: AppCollectionConfigurationItem;
}

export function DebugPopup({ app }: DebugPopupProps) {
  const [port, setPort] = useState(
    localStorage.getItem(`${DEBUG_KEYS.SPFXEXT}${app.name}`) ?? ""
  );
  const [popoverOpen, setOpen] = useState(false);
  return (
    <Popover positioning={"after"} open={popoverOpen}>
      <PopoverTrigger disableButtonEnhancement>
        <Checkbox
          checked={isAppInDebug(app.name)}
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
            localStorage.setItem(`${DEBUG_KEYS.SPFXEXT}${app.name}`, port);
            setOpen(false);
          }}
        >
          Save
        </Button>
      </PopoverSurface>
    </Popover>
  );
}
