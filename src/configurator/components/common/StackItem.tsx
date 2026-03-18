import { makeStyles } from "@fluentui/react-components";
import type { JSX, RenderableProps } from "preact";

type StackItemAlignment = 'auto' | 'stretch' | 'baseline' | 'start' | 'center' | 'end'

interface StackProps {
    /**
     * Defines a CSS class name used to style the StackItem.
     */
    className?: string;
    /**
     * Defines how much to grow the StackItem in proportion to its siblings.
     */
    grow?: boolean | number | 'inherit' | 'initial' | 'unset';
    /**
     * Defines at what ratio should the StackItem shrink to fit the available space.
     */
    shrink?: boolean | number | 'inherit' | 'initial' | 'unset';
    /**
     * Defines whether the StackItem should be prevented from shrinking.
     * This can be used to prevent a StackItem from shrinking when it is inside of a Stack that has shrinking items.
     * @defaultvalue false
     */
    disableShrink?: boolean;
    /**
     * Defines how to align the StackItem along the x-axis (for vertical Stacks) or the y-axis (for horizontal Stacks).
     */
    align?: StackItemAlignment;
    /**
     * Defines whether the StackItem should take up 100% of the height of its parent.
     * @defaultvalue true
     */
    verticalFill?: boolean;
    /**
     * Defines the initial main size of the StackItem, setting the size of the content box unless otherwise set with
     * box-sizing.
     * @defaultvalue auto
     */
    basis?: JSX.CSSProperties['flexBasis'];
}
const useStackStyles = makeStyles({
  root: {
    height: "auto",
    width: "auto",
  },
  verticalFill: {
    height: "100%",
  },
  disableShrink: {
    flexShrink: 0,
  },
  alignAuto: {
    alignSelf: "auto"
  },
  alignStretch: {
    alignSelf: "stretch"
  },
  alignBaseline: {
    alignSelf: "baseline"
  },
  alignStart: {
    alignSelf: "start"
  },
  alignCenter: {
    alignSelf: "center"
  },
  alignEnd: {
    alignSelf: "end"
  },
});

export function StackItem(props: RenderableProps<StackProps>) {
  const stackStyles = useStackStyles();
  const classes = [stackStyles.root];
  const additionalStyles: JSX.CSSProperties = {};
  if(props.disableShrink) {
    classes.push(stackStyles.disableShrink);
  }
  else if(props.shrink) {
    additionalStyles.flexShrink = props.shrink as any;
  }
  if(props.grow) {
    additionalStyles.flexGrow = props.grow as any;
  }
  if(props.basis) {
    additionalStyles.flexBasis = props.basis;
  }
  addAlignment(props, classes, stackStyles);
  if(props.className) {
    classes.push(props.className);
  }
  return (
    <div className={classes.join(" ")} style={{ ...additionalStyles}}>
      {props.children}
    </div>
  );
}

function addAlignment(
  props: RenderableProps<StackProps>,
  classes: string[],
  stackStyles: ReturnType<typeof useStackStyles>
) {
  switch (props.align) {
    case "start":
      classes.push(stackStyles.alignStart);
      break;
    case "end":
      classes.push(stackStyles.alignEnd);
      break;
    case "center":
      classes.push(stackStyles.alignCenter);
      break;
    case "stretch":
      classes.push(stackStyles.alignStretch);
      break;
    case "baseline":
      classes.push(stackStyles.alignBaseline);
      break;
    case "auto":
      classes.push(stackStyles.alignAuto);
      break;
  }
}