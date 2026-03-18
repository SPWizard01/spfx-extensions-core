import { webLightTheme } from "@fluentui/react-components";

export const baseStyle = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 4,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  outline: "none",
  transition: "border .24s ease-in-out",
  gap: 12,
  minHeight: "68px",
  justifyContent: "center",
};

export const focusedStyle = {
  borderColor: webLightTheme.colorCompoundBrandForeground1,
};

export const acceptStyle = {
  borderColor: webLightTheme.colorPaletteGreenForeground1,
};

export const rejectStyle = {
  borderColor: webLightTheme.colorPaletteRedForeground1,
};
