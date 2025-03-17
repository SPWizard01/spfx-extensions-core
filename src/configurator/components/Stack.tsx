import { makeStyles } from "@fluentui/react-components";
import type { JSX, RenderableProps } from "preact";

type Alignment =
  | "start"
  | "end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly"
  | "baseline"
  | "stretch";

interface StackProps {
  /**
   * Defines whether to render Stack children horizontally.
   * @defaultvalue false
   */
  horizontal?: boolean;
  /**
   * Defines whether to render Stack children in the opposite direction (bottom-to-top if it's a vertical Stack and
   * right-to-left if it's a horizontal Stack).
   * @defaultvalue false
   */
  reversed?: boolean;
  /**
   * Defines how to align Stack children horizontally (along the x-axis).
   */
  horizontalAlign?: Alignment;
  /**
   * Defines how to align Stack children vertically (along the y-axis).
   */
  verticalAlign?: Alignment;
  /**
   * Defines whether the Stack should take up 100% of the height of its parent.
   * This property is required to be set to true when using the `grow` flag on children in vertical oriented Stacks.
   * Stacks are rendered as block elements and grow horizontally to the container already.
   * @defaultvalue false
   */
  verticalFill?: boolean;
  /**
   * Defines how much to grow the Stack in proportion to its siblings.
   */
  grow?: boolean | number | "inherit" | "initial" | "unset";
  /**
   * Defines whether Stack children should wrap onto multiple rows or columns when they are about to overflow
   * the size of the Stack.
   * @defaultvalue false
   */
  wrap?: boolean;
  gap?: JSX.CSSProperties["gap"];
}
const useStackStyles = makeStyles({
  root: {
    display: "flex",
    height: "auto",
    width: "auto",
    boxSizing: "border-box",
    //   flexDirection: props.horizontal ? "row" : "column",
  },
  horizontal: {
    flexDirection: "row",
  },
  vertical: {
    flexDirection: "column",
  },
  wrap: {
    flexWrap: "wrap",
  },
  noWrap: {
    flexWrap: "nowrap",
  },
  horizontalAlign_start: {
    justifyContent: "flex-start",
  },
  horizontalAlign_end: {
    justifyContent: "flex-end",
  },
  horizontalAlign_center: {
    justifyContent: "center",
  },
  horizontalAlign_spaceBetween: {
    justifyContent: "space-between",
  },
  horizontalAlign_spaceAround: {
    justifyContent: "space-around",
  },
  horizontalAlign_spaceEvenly: {
    justifyContent: "space-evenly",
  },
  horizontalAlign_stretch: {
    justifyContent: "stretch",
  },
  verticalAlign_start: {
    alignItems: "flex-start",
  },
  verticalAlign_end: {
    alignItems: "flex-end",
  },
  verticalAlign_center: {
    alignItems: "center",
  },
  verticalAlign_spaceBetween: {
    alignItems: "space-between",
  },
  verticalAlign_spaceAround: {
    alignItems: "space-around",
  },
  verticalAlign_spaceEvenly: {
    alignItems: "space-evenly",
  },
  verticalAlign_stretch: {
    alignItems: "stretch",
  },
  reversedHorizontal: {
    flexDirection: "row-reverse",
  },
  reversedVertical: {
    flexDirection: "column-reverse",
  },
});

export function Stack(props: RenderableProps<StackProps>) {
  const stackStyles = useStackStyles();
  const classes = [stackStyles.root];
  const additionalStyles: JSX.CSSProperties = {};
  if (props.horizontal) {
    if (props.reversed) {
      classes.push(stackStyles.reversedHorizontal);
    } else {
      classes.push(stackStyles.horizontal);
    }
  } else {
    if (props.reversed) {
      classes.push(stackStyles.reversedVertical);
    } else {
      classes.push(stackStyles.vertical);
    }
  }
  if (props.grow) {
    additionalStyles.flexGrow = props.grow as any;
  }
  if (props.gap) {
    additionalStyles.gap = props.gap;
  }

  classes.push(props.wrap ? stackStyles.wrap : stackStyles.noWrap);
  addHorizontalAlignment(props, classes, stackStyles);
  addVerticalAlignment(props, classes, stackStyles);
  return (
    <div className={classes.join(" ")} style={{ ...additionalStyles }}>
      {props.children}
    </div>
  );
}
function addHorizontalAlignment(
  props: RenderableProps<StackProps>,
  classes: string[],
  stackStyles: ReturnType<typeof useStackStyles>
) {
  switch (props.horizontalAlign) {
    case "start":
      classes.push(stackStyles.horizontalAlign_start);
      break;
    case "end":
      classes.push(stackStyles.horizontalAlign_end);
      break;
    case "center":
      classes.push(stackStyles.horizontalAlign_center);
      break;
    case "space-between":
      classes.push(stackStyles.horizontalAlign_spaceBetween);
      break;
    case "space-around":
      classes.push(stackStyles.horizontalAlign_spaceAround);
      break;
    case "space-evenly":
      classes.push(stackStyles.horizontalAlign_spaceEvenly);
      break;
    case "stretch":
      classes.push(stackStyles.horizontalAlign_stretch);
      break;
  }
}
function addVerticalAlignment(
  props: RenderableProps<StackProps>,
  classes: string[],
  stackStyles: ReturnType<typeof useStackStyles>
) {
  switch (props.verticalAlign) {
    case "start":
      classes.push(stackStyles.verticalAlign_start);
      break;
    case "end":
      classes.push(stackStyles.verticalAlign_end);
      break;
    case "center":
      classes.push(stackStyles.verticalAlign_center);
      break;
    case "space-between":
      classes.push(stackStyles.verticalAlign_spaceBetween);
      break;
    case "space-around":
      classes.push(stackStyles.verticalAlign_spaceAround);
      break;
    case "space-evenly":
      classes.push(stackStyles.verticalAlign_spaceEvenly);
      break;
    case "stretch":
      classes.push(stackStyles.verticalAlign_stretch);
      break;
  }
}
