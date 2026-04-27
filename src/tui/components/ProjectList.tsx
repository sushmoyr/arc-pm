import React from 'react';
import { Text } from 'ink';
import type { BoxProps } from 'ink';
import { useStore } from '../store.js';
import { Pane } from '../primitives/Pane.js';
import { ListItem } from '../primitives/ListItem.js';

interface ProjectListProps {
  width?: BoxProps['width'];
  flexGrow?: number;
}

export function ProjectList({ width, flexGrow }: ProjectListProps) {
  const { state } = useStore();
  const focused = state.focus === 'projects';
  return (
    <Pane title="Projects" focused={focused} width={width} flexGrow={flexGrow}>
      {state.projects.length === 0 && <Text dimColor>(none — run `arc init`)</Text>}
      {state.projects.map((p, i) => {
        const selected = i === state.projectCursor;
        return (
          <ListItem
            key={p.id}
            selected={selected}
            focused={focused}
            columns={[
              { text: p.id, bold: selected },
              { text: p.name, dim: true },
            ]}
          />
        );
      })}
    </Pane>
  );
}
