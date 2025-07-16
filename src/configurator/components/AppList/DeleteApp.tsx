import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Link,
  Spinner,
  Text,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { Delete20Regular } from "@fluentui/react-icons";
import { useState } from "preact/hooks";
import { SPFX_EXTENSIONS_FOLDER } from "../../../utilities/constants";
import { cloneObject } from "../../../utilities/helpers";
import type { AppCollectionConfigurationItem } from "../../models/appCollectionConfigurationItem";
import {
  allAppItems,
  configrationWebUrl,
  configurationWebSP,
  deletingAppItem,
} from "../../runtimeStore";
import { removeAppCollection } from "../../services/appCollection";

interface DeleteAppProps {
  item: AppCollectionConfigurationItem;
}

async function deleteCollection(app: AppCollectionConfigurationItem) {
  try {
    deletingAppItem.value = cloneObject(app);
    await removeAppCollection(configurationWebSP, app.name);
    allAppItems.value = allAppItems.value.filter((f) => f.name !== app.name);
  } finally {
    deletingAppItem.value = undefined;
  }
}

export function DeleteApp({ item }: DeleteAppProps) {
  const [dialogOpen, setOpen] = useState(false);
  function dialogOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    setOpen(data.open);
  }
  return (
    <>
      <Link
        disabled={deletingAppItem?.value?.name !== undefined}
        onClick={() => {
          setOpen(true);
        }}
      >
        <div style={{ display: "flex" }}>
          <Delete20Regular />
          {deletingAppItem.value?.name === item.name && (
            <Spinner size="extra-small" />
          )}
        </div>
      </Link>
      <Dialog
        open={dialogOpen}
        surfaceMotion={null}
        modalType="modal"
        onOpenChange={dialogOpenChange}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete {item.name}?</DialogTitle>
            <DialogContent>
              <Text>
                Are you sure you want to delete app collection{" "}
                <b>{item.name}</b>?
              </Text>
              <br />
              <Text>
                Deleting appcollection will result in deletion of all files in{" "}
                <Link
                  target="_blank"
                  onClick={() => {
                    window.open(
                      `${configrationWebUrl}/${SPFX_EXTENSIONS_FOLDER}/${item.name}`,
                      "_blank"
                    );
                  }}
                >
                  this location
                </Link>
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={() => {
                  deleteCollection(item);
                  setOpen(false);
                }}
              >
                Yes
              </Button>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">No</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
