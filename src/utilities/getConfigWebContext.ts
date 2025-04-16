import {
  getConfigurationWebIsHubChild,
  getConfigurationWebIsRootHub,
  getConfigurationWebIsSubsite,
} from "../configurator/runtimeStore";
import { getConfiguringWebUrl } from "../configurator/services/webConfiguratorService";

export function GetWebConfigContext():
  | "hubRoot"
  | "hubChild"
  | "nonHub"
  | "subsite"
  | "global"
  | "other" {
  if (!getConfiguringWebUrl()) {
    return "global";
  }
  if (getConfigurationWebIsRootHub()) {
    return "hubRoot";
  }
  if (getConfigurationWebIsHubChild() && !getConfigurationWebIsRootHub()) {
    return "hubChild";
  }
  if (!getConfigurationWebIsRootHub() && !getConfigurationWebIsHubChild()) {
    return "nonHub";
  }
  if (getConfigurationWebIsSubsite()) {
    return "subsite";
  }
  return "other";
}
