import { Badge, Link, makeStyles, Title2 } from "@fluentui/react-components";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import {
  configurationWebBelongsToHub,
  configurationWebIsRootHub,
} from "../runtimeStore";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
import { AppList } from "./AppList";
import { SelectedAppConfig } from "./SelectedAppConfig";

const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    width: "auto",
    height: "auto",
    boxSizing: "border-box",
    marginTop: "12px",
    marginLeft: "32px",
    marginRight: "32px",
    "> :not(:last-child)": {
      marginBottom: "12px",
    },
  },
  webDetails: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    "> :not(:last-child)": {
      marginRight: "10px",
    },
  },
});

export function Index() {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <Title2>{queryWeb ? "Web" : "Global"} application list</Title2>
      {queryWeb && (
        <div className={styles.webDetails}>
          {configurationWebIsRootHub && (
            <Badge size="extra-large" color="success">
              Hub root site
            </Badge>
          )}
          {configurationWebBelongsToHub && (
            <Badge size="extra-large" color="warning">
              Hub child site
            </Badge>
          )}
          {!configurationWebIsRootHub && !configurationWebBelongsToHub && (
            <Badge size="extra-large" color="danger">
              Non hub site
            </Badge>
          )}
          <Link target="_blank" href={cfgWeb}>
            {cfgWeb}
          </Link>
        </div>
      )}
      <AppList />
      <SelectedAppConfig />
    </div>
  );
}
