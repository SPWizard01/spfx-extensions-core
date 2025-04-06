import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Label,
  Spinner,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";
import { Add24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { HttpRequestError } from "@pnp/queryable";
import type { IWebInfo } from "@pnp/sp/webs";
import type { ComponentChildren } from "preact";
import { useState } from "react";
import { getPnPSP } from "../services/pnpService";
import { toasterId } from "./ToastNotification";
interface AddWebProps {
  disabled?: boolean;
  onWebResolved?: (web: IWebInfo) => void;
  children?: ComponentChildren;
}
export function AddWeb({ disabled, onWebResolved }: AddWebProps) {
  const urlMatcher = /^\/([a-zA-Z0-9]|\/)*$/;
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  async function dialogOpenChange(
    _event: DialogOpenChangeEvent,
    data: DialogOpenChangeData
  ) {
    setOpen(data.open);
  }

  const { dispatchToast, updateToast } = useToastController(toasterId);

  const notify = (intent: "progress") => {
    switch (intent) {
      case "progress":
        dispatchToast(
          <Toast>
            <ToastTitle media={<Spinner size="tiny" />}>
              Resolving...
            </ToastTitle>
          </Toast>,
          {
            toastId: toasterId,
            timeout: -1,
          }
        );
        break;
    }
  };

  async function resolveWeb() {
    if (!inputValue) return;
    notify("progress");
    const sp = getPnPSP(window.location.origin + inputValue);
    try {
      const web = await sp.web();
      updateToast({
        content: (
          <Toast>
            <ToastTitle>Web resolved</ToastTitle>
            <ToastBody>
              {web.Title} {web.Id}
            </ToastBody>
          </Toast>
        ),
        intent: "success",
        toastId: toasterId,
        timeout: 2000,
      });
      onWebResolved?.(web);
      setOpen(false);
    } catch (e) {
      if (e instanceof HttpRequestError) {
        const message =
          e.status === 404
            ? "Web not found"
            : e.status === 403
            ? "Access denied"
            : e.message;
        updateToast({
          content: (
            <Toast>
              <ToastTitle>Error occured while resolving web.</ToastTitle>
              <ToastBody>{message}</ToastBody>
            </Toast>
          ),
          intent: "error",
          toastId: toasterId,
          timeout: 2000,
        });
      }
    }
  }

  return (
    <Dialog
      open={open}
      surfaceMotion={null}
      modalType="alert"
      onOpenChange={dialogOpenChange}
    >
      <DialogTrigger action="open">
        <Button
          appearance="primary"
          disabled={disabled}
          icon={<Add24Regular />}
        >
          Add web
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger disableButtonEnhancement action="close">
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<Dismiss24Regular />}
                />
              </DialogTrigger>
            }
          >
            Add Web by URL
          </DialogTitle>
          <DialogContent style={{ padding: "16px 0" }}>
            <Field
              validationMessage={
                !inputValue
                  ? ""
                  : inputValue && urlMatcher.test(inputValue)
                  ? ""
                  : "The input string is not in correct format."
              }
              validationState={
                !inputValue
                  ? "none"
                  : inputValue && urlMatcher.test(inputValue)
                  ? "none"
                  : "error"
              }
            >
              <Input
                value={inputValue}
                style={{ width: "100%" }}
                placeholder="/sites/your-site/or-your-web"
                contentBefore={<Label>{window.location.origin}</Label>}
                onChange={(_, d) => {
                  setInputValue(d.value);
                }}
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement action="close">
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              disabled={!inputValue || !urlMatcher.test(inputValue)}
              onClick={() => {
                resolveWeb();
              }}
            >
              Add
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
