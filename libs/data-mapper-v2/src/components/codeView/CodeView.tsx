import { Stack } from "@fluentui/react";
import { Button, DrawerBody, DrawerHeader, DrawerHeaderTitle, InlineDrawer, Text } from "@fluentui/react-components";
import { Code20Regular, Dismiss20Regular } from "@fluentui/react-icons";
import type { MonacoProps } from "@microsoft/designer-ui";
import { MonacoEditor } from "@microsoft/designer-ui";
import { EditorLanguage } from "@microsoft/logic-apps-shared";
import { useIntl } from "react-intl";
import { useSelector } from "react-redux";
import type { RootState } from "../../core/state/Store";
import { useStyles } from "./styles";

export const minCodeViewWidth = 320;

export const commonCodeEditorProps: Partial<MonacoProps> = {
  lineNumbers: "on",
  scrollbar: { horizontal: "hidden", vertical: "auto" },
  height: "650px",
  wordWrap: "on",
  wrappingIndent: "same",
};

export const CodeView = () => {
  const intl = useIntl();
  const styles = useStyles();

  const dataMapDefinition = useSelector(
    (state: RootState) => state.dataMap.present.curDataMapOperation.dataMapLML
  );
  const isCodeViewOpen = useSelector(
    (state: RootState) => state.panel.isCodeViewOpen
  );

  const codeViewLoc = intl.formatMessage({
    defaultMessage: "Code",
    id: "M0xrm+",
    description: "Code view title",
  });

  const closeCodeViewLoc = intl.formatMessage({
    defaultMessage: "Close code view",
    id: "3sJlV+",
    description: "Close code view button",
  });

  const noMapDefLoc = intl.formatMessage({
    defaultMessage: "Unable to generate data map definition",
    id: "sv+IcU",
    description: `Message to display when the data map definition can't be generated`,
  });

  // return (
  //   <div
  //     className={mergeClasses(
  //       styles.root,
  //       isResizing && styles.rootResizerActive
  //     )}
  //   >
  //     <div className={styles.container}>
  //       <InlineDrawer
  //         open
  //         ref={sidebarRef}
  //         className={styles.drawer}
  //         style={{ width: `${sidebarWidth}px` }}
  //         onMouseDown={(e) => e.preventDefault()}
  //       >
  //         <DrawerHeader>
  //           <DrawerHeaderTitle>Code</DrawerHeaderTitle>
  //         </DrawerHeader>
  //         <DrawerBody>
  //           <p>Resizable content</p>
  //         </DrawerBody>
  //       </InlineDrawer>
  //       <ResizeComponent />
  //     </div>
  //     <p className={styles.content}>Resize the drawer to see the change</p>
  //   </div>
  // );

  return(
    <InlineDrawer open={isCodeViewOpen} className={styles.drawer}>
      <DrawerHeader style={{display: 'flex', flexDirection: 'row'}}>
        <Code20Regular />
          <Text className={styles.titleTextStyle}>
                {codeViewLoc}
              </Text>
      </DrawerHeader>
      <DrawerBody className={styles.drawerBody}>
        <div className={styles.editorDiv}>
          <MonacoEditor
            language={EditorLanguage.yaml}
            value={dataMapDefinition === '' ? noMapDefLoc : dataMapDefinition}
            className={styles.editorStyle}
            {...commonCodeEditorProps}
            readOnly
          />
        </div>
      </DrawerBody>
    </InlineDrawer>
  )

  // return (
  //   <Stack
  //     // style={{
  //     //   display: isCodeViewOpen ? 'flex' : 'none',
  //     //   width: minCodeViewWidth,
  //     // }}
  //     horizontal={true}
  //     className={styles.stack}
  //     verticalFill
  //   >
  //     <InlineDrawer
  //       style={{
  //         width: '10px',
  //         cursor: isCodeViewOpen ? 'col-resize' : 'auto',
  //       }}
  //       draggable={isCodeViewOpen ? 'true' : 'false'}>
  //     <div className={styles.containerStyle}>
  //       <Stack horizontal={false} verticalAlign="center" horizontalAlign="center">
  //         <DrawerHeader>
  //           horizontal
  //           verticalAlign="center"
  //           {/* style={{
  //             width: '100%',
  //             justifyContent: 'space-between',
  //             marginBottom: '12px',
  //             marginTop: '4px',
  //           }} */}

  //           <Stack horizontal verticalAlign="center">

  //           </Stack>
  //           </DrawerHeader>
  //           <Button
  //             icon={<Dismiss20Regular />}
  //             appearance="subtle"
  //             //onClick={() => setIsCodeViewOpen(false)}
  //             aria-label={closeCodeViewLoc}
  //           />
  //         </Stack>

  //         <div
  //           className={styles.editorDiv}
  //         >
  //           <MonacoEditor
  //             language={EditorLanguage.yaml}
  //             value={dataMapDefinition === '' ? noMapDefLoc : dataMapDefinition}
  //             className={styles.editorStyle}
  //             {...commonCodeEditorProps}
  //             readOnly
  //           />
  //         </div>
  //         </div>
  //     </InlineDrawer>
  //   </Stack>
  // );
};
