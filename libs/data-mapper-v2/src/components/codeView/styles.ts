import {
  makeStyles,
  shorthands,
  tokens,
  typographyStyles,
} from "@fluentui/react-components";

export const useStyles = makeStyles({
  drawer: {
    minWidth: "25%",
    ...shorthands.borderLeft("1px", "solid", "#e0e0e0"),
    backgroundColor: "#E8F2FD",
  },
  containerStyle: {
    height: "100%",
    width: "100%",
    ...shorthands.overflow("hidden"),
    ...shorthands.padding("12px"),
    boxSizing: "border-box",
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  drawerBody: {
    paddingTop: "0px",
    marginTop: "0px",
    backgroundColor: "inherit",
  },
  titleTextStyle: {
     marginLeft: '0px',
    ...typographyStyles.body1Strong,
  },
  editorStyle: {
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    paddingTop: '10px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  editorDiv: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
});
