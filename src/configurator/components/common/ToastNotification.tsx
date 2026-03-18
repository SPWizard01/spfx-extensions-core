import { Toaster } from "@fluentui/react-components";

export const toasterId = "global-toast-notification";
export function ToastNotification() {
  return <Toaster toasterId={toasterId} />;
}
