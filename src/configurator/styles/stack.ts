import { makeStyles } from "@fluentui/react-components";

export const useRowStack = makeStyles({
    stack: {
        flexDirection: "row",
        display: "flex",
        flexWrap: "wrap",
    },
    stackItem: {
        flexBasis: "100%",
    },
});

export const useColumnStack = makeStyles({
    stack: {
        flexDirection: "column",
        display: "flex",
        flexWrap: "nowrap",
    },
    stackItem: {
        // flexBasis: "100%",
    },
});