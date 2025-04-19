import {
  configurationIsGlobal,
  getConfigurationWebIsHubChild,
  getConfigurationWebIsRootHub,
  getConfigurationWebIsSubsite,
} from "../configurator/runtimeStore";

export function GetWebConfigContext() {
  if (configurationIsGlobal) {
    return "global";
  }
  if (getConfigurationWebIsRootHub()) {
    return "hubRoot";
  }
  if (getConfigurationWebIsHubChild() && !getConfigurationWebIsRootHub()) {
    return "hubChild";
  }
  if (!getConfigurationWebIsHubChild()) {
    return "nonHub";
  }
  if (getConfigurationWebIsSubsite()) {
    return "subsite";
  }
  return "other";
}
