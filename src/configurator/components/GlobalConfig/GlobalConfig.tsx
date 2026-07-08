import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  Input,
  Spinner,
  Subtitle2,
  Switch,
  Text,
  Toast,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useSignal, useSignalEffect } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { getRuntimeCacheItem } from "../../../core/services/coreIdbService";
import { logGenericCoreError } from "../../../core/services/loggingService";
import { SettingDescriptors } from "../../../core/utility/defaultConfig";
import { configurationWebSP, configurationWebUrl, showGlobalConfig } from "../../runtimeStore";
import {
  getEffectiveSettings,
  type GlobalSettingItem,
  upsertSetting,
} from "../../services/globalConfigService";
import { Stack } from "../common/Stack";
import { toasterId } from "../common/ToastNotification";

interface RuntimeInfo {
  appCatalogUrl?: string;
}

function toDataSiteUrl(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  return data.Url ?? data.ServerRelativeUrl ?? data.d?.Url ?? "(cached)";
}

export function GlobalConfig() {
  const { dispatchToast } = useToastController(toasterId);
  const loading = useSignal(true);
  const saving = useSignal(false);
  const settings = useSignal<GlobalSettingItem[]>([]);
  const original = useSignal<Record<string, string>>({});
  const runtime = useSignal<RuntimeInfo>({});

  async function load() {
    loading.value = true;
    try {
      const effective = await getEffectiveSettings(configurationWebSP, configurationWebUrl.href);
      settings.value = effective;
      original.value = Object.fromEntries(effective.map((s) => [s.Title, `${s.Data}`]));
      const appCatalog = await getRuntimeCacheItem("AppCatalogUrl");
      runtime.value = {
        appCatalogUrl: appCatalog?.Data,
      };
    } catch (err) {
      logGenericCoreError("Failed to load global configuration", err);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to load configuration.</ToastTitle>
        </Toast>,
        { intent: "error", position: "top" }
      );
    } finally {
      loading.value = false;
    }
  }

  useSignalEffect(() => {
    if (showGlobalConfig.value) {
      load();
    }
  });

  function setSetting(title: string, data: string) {
    settings.value = settings.value.map((s) => (s.Title === title ? { ...s, Data: data } : s));
  }

  async function save() {
    saving.value = true;
    try {
      const changed = settings.value.filter((s) => `${s.Data}` !== original.value[s.Title]);
      for (const s of changed) {
        await upsertSetting(configurationWebSP, s.Title, `${s.Data}`, s.Id);
      }
      await load();
      dispatchToast(
        <Toast>
          <ToastTitle>Settings saved. Changes apply within a few minutes or on reload.</ToastTitle>
        </Toast>,
        { intent: "success", position: "top" }
      );
    } catch (err) {
      logGenericCoreError("Failed to save global configuration", err);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to save settings.</ToastTitle>
        </Toast>,
        { intent: "error", position: "top" }
      );
    } finally {
      saving.value = false;
    }
  }

  const close = () => (showGlobalConfig.value = false);
  const modified = settings.value.some((s) => `${s.Data}` !== original.value[s.Title]);

  return (
    <Drawer
      open={showGlobalConfig.value}
      onOpenChange={(_: unknown, data: { open: boolean }) => (showGlobalConfig.value = data.open)}
      position="end"
      size="large"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" icon={<Dismiss24Regular />} onClick={close} />}
        >
          Global configuration
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        {loading.value ? (
          <Spinner label="Loading configuration…" />
        ) : (
          <Stack gap={20} style={{ paddingTop: "12px" }}>
            <Stack gap={12}>
              <Subtitle2>Settings</Subtitle2>
              {settings.value.map((s) => {
                const desc = SettingDescriptors[s.Title];
                if (!desc) return null;
                return (
                  <Field key={s.Title} label={desc.label} hint={desc.description}>
                    {desc.type === "boolean" ? (
                      <Switch
                        checked={`${s.Data}` === "true"}
                        onChange={(_, d) => setSetting(s.Title, d.checked ? "true" : "false")}
                      />
                    ) : (
                      <Input
                        value={`${s.Data ?? ""}`}
                        onChange={(_, d) => setSetting(s.Title, d.value)}
                      />
                    )}
                  </Field>
                );
              })}
            </Stack>

            <Divider />

            <Stack gap={12}>
              <Subtitle2>Runtime</Subtitle2>
              <DiagRow label="App catalog URL" value={runtime.value.appCatalogUrl ?? "—"} />
              <DiagRow label="Version" value={APP_VERSION} />
              <DiagRow label="Build date" value={BUILD_DATE} />
            </Stack>
          </Stack>
        )}
      </DrawerBody>
      <DrawerFooter>
        <Button appearance="primary" disabled={!modified || saving.value} onClick={save}>
          {saving.value ? "Saving…" : "Save"}
        </Button>
        <Button appearance="secondary" onClick={close}>
          Close
        </Button>
      </DrawerFooter>
    </Drawer>
  );
}

function DiagRow({ label, value }: { label: string; value: ComponentChildren }) {
  return (
    <Stack horizontal gap={8} verticalAlign="center" style={{ flexWrap: "wrap" }}>
      <Text weight="semibold" style={{ minWidth: "120px" }}>
        {label}
      </Text>
      <Text style={{ wordBreak: "break-all" }}>{value}</Text>
    </Stack>
  );
}
