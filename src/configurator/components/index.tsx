import {
  Button,
  Link,
  makeStyles,
  MessageBar,
  Spinner,
  Text,
  Title2,
} from "@fluentui/react-components";
import { Suspense } from "react";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import { getConfiguringWebUrl } from "../services/webConfiguratorService";
import { AddApp } from "./AddApp";
import { AppList } from "./AppList";
import { FilePicker } from "./FilePicker";

const queryWeb = getConfiguringWebUrl();
const cfgWeb = queryWeb ?? getWebAbsoluteUrl();

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    padding: "0 32px",
    gap: "20px",
    marginTop: "20px",
  }
});

export function Index() {
  const styles = useStyles();
  return (
    <div>
      <div className={styles.container}>
        <Title2>{queryWeb ? "Web" : "Global"} application list</Title2>
        {queryWeb && (
          <MessageBar>
            <Text>
              Web you are customizing:{" "}
              <Link target="_blank" href={cfgWeb}>
                {cfgWeb}
              </Link>
            </Text>
          </MessageBar>
        )}
        <AppList />
      </div>
      <AddApp />
    </div>
  );
}
