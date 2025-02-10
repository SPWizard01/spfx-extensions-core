import {
  Badge,
  Link,
  makeStyles,
  MessageBar,
  Text,
  Title2,
} from "@fluentui/react-components";
import { useSignals } from "@preact/signals-react/runtime";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import {
  configurationWebBelongsToHub,
  configurationWebIsRootHub,
} from "../runtimeStore";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
import { AddApp } from "./AddApp";
import { AppList } from "./AppList";
import { ManifestModal } from "./ManifestModal";

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
  useSignals();

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
      {/* {queryWeb && 
      (
        <MessageBar color="">
          <Text>
            Web you are customizing:{" "}
            <Link target="_blank" href={cfgWeb}>
              {cfgWeb}
            </Link>
            {configurationWebIsRootHub && (
              <>
                {" "}
                <Badge>Hub Site</Badge>
              </>
            )}
            {configurationWebBelongsToHub && (
              <>
                {" "}
                <Badge color="important">Hub child</Badge>
              </>
            )}
          </Text>
        </MessageBar>
      )
      } */}
      <AppList />
      <div>
        <AddApp />
      </div>
      <ManifestModal />
    </div>
  );
}
