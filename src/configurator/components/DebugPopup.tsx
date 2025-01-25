import {
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  TableCellLayout,
} from "@fluentui/react-components";
import { useState } from "react";
import { DEBUG_KEYS } from "../../utilities/debug";
import type { AppsItem } from "../models/appsItem";

interface DebugPopupProps {
  app: AppsItem;
}

export function DebugPopup({ app }: DebugPopupProps) {
  const [port, setPort] = useState(
    localStorage.getItem(`${DEBUG_KEYS.SPFXEXT}${app.name}`) ?? ""
  );
  const [popoverOpen, setOpen] = useState(false);
  return (
    <TableCellLayout>
      <Popover positioning={"after"} open={popoverOpen}>
        <PopoverTrigger disableButtonEnhancement>
          <Checkbox
            checked={app.isInDebug()}
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
    </TableCellLayout>
  );
}
