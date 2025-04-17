import { Badge } from "@fluentui/react-components";

export function GetBadge(
  color:
    | "subtle"
    | "success"
    | "brand"
    | "danger"
    | "important"
    | "informative"
    | "severe"
    | "warning"
    | undefined,
  text: string,
  width: string = "72px"
) {
  return (
    <Badge size="medium" color={color} style={{ width: width }}>
      {text}
    </Badge>
  );
}
