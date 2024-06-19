import { type SchemaExtended, SchemaType, equals } from '@microsoft/logic-apps-shared';
import { Tree, mergeClasses } from '@fluentui/react-components';
import { useStyles } from './styles';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useIntl } from 'react-intl';
import RecursiveTree from './RecursiveTree';
import { flattenSchemaNodeMap } from '../../../utils';
import { type Node, applyNodeChanges, type NodeChange } from 'reactflow';
import type { AppDispatch, RootState } from '../../../core/state/Store';
import { useDispatch, useSelector } from 'react-redux';
import { updateReactFlowNodes } from '../../../core/state/DataMapSlice';

export type SchemaTreeProps = {
  schemaType?: SchemaType;
  schema: SchemaExtended;
};

export const SchemaTree = (props: SchemaTreeProps) => {
  const styles = useStyles();
  const {
    schemaType,
    schema: { schemaTreeRoot },
  } = props;

  const isLeftDirection = useMemo(() => equals(schemaType, SchemaType.Source), [schemaType]);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [updatedNodes, setUpdatedNodes] = useState<Record<string, Node>>({});

  const intl = useIntl();
  const dispatch = useDispatch<AppDispatch>();
  const treeRef = useRef<HTMLDivElement | null>(null);
  const flattenedScehmaMap = useMemo(() => flattenSchemaNodeMap(schemaTreeRoot), [schemaTreeRoot]);
  const totalNodes = useMemo(() => Object.keys(flattenedScehmaMap).length, [flattenedScehmaMap]);
  const { nodes } = useSelector((state: RootState) => state.dataMap.present.curDataMapOperation);

  const treeAriaLabel = intl.formatMessage({
    defaultMessage: 'Schema tree',
    id: 't2Xi1/',
    description: 'tree showing schema nodes',
  });

  const setUpdatedNode = useCallback(
    (node: Node) => {
      setUpdatedNodes((prev) => ({ ...prev, [node.id]: node }));
    },
    [setUpdatedNodes]
  );

  useEffect(() => {
    if (Object.keys(updatedNodes).length === totalNodes) {
      const nodeChanges: NodeChange[] = [];
      for (const node of nodes) {
        const id = node.id;
        const updatedNode = updatedNodes[id];
        if (updatedNode) {
          if (updatedNode.position.x === 0 && updatedNode.position.y === 0) {
            nodeChanges.push({ id: id, type: 'remove' });
          } else {
            nodeChanges.push({
              id: id,
              type: 'position',
              position: updatedNode.position,
            });
          }
        } else {
          nodeChanges.push({ type: 'add', item: updatedNode });
        }
      }
      const newNodes = applyNodeChanges(nodeChanges, nodes);
      setUpdatedNodes({});
      dispatch(updateReactFlowNodes(newNodes));
    }
  }, [nodes, updatedNodes, totalNodes, dispatch]);

  useEffect(() => {
    setOpenKeys(new Set<string>(Object.keys(flattenedScehmaMap).filter((key) => flattenedScehmaMap[key].children.length > 0)));
    console.log('Map Length: ', Object.keys(flattenedScehmaMap).length);
  }, [flattenedScehmaMap, setOpenKeys]);
  return schemaTreeRoot ? (
    <Tree
      ref={treeRef}
      className={isLeftDirection ? mergeClasses(styles.leftWrapper, styles.wrapper) : mergeClasses(styles.rightWrapper, styles.wrapper)}
      aria-label={treeAriaLabel}
    >
      <RecursiveTree
        root={schemaTreeRoot}
        isLeftDirection={isLeftDirection}
        setOpenKeys={setOpenKeys}
        openKeys={openKeys}
        flattenedScehmaMap={flattenedScehmaMap}
        setUpdatedNode={setUpdatedNode}
      />
    </Tree>
  ) : null;
};
