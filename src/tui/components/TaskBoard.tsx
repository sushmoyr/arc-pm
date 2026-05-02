import React from 'react';
import { Text } from 'ink';
import { visibleTasks, useStore } from '../store.js';
import { Pane } from '../primitives/Pane.js';
import { ListItem, type Column } from '../primitives/ListItem.js';
import { theme } from '../config/theme.js';
import type { Task } from '../../types/domain.js';

interface TaskBoardProps {
  flexGrow?: number;
  width?: number;
}

export function TaskBoard({ flexGrow, width }: TaskBoardProps) {
  const { state } = useStore();
  const focused = state.focus === 'tasks';
  const visible = visibleTasks(state);
  const titleSuffix = state.searchQuery
    ? ` · /${state.searchQuery} (${visible.length})`
    : state.selectedProjectId
      ? ` · ${state.selectedProjectId}`
      : '';

  return (
    <Pane
      title={`Tasks${titleSuffix}`}
      focused={focused}
      flexGrow={flexGrow}
      width={width}
    >
      {visible.length === 0 && (
        <Text dimColor>
          {state.searchQuery ? '(no matches)' : "(no tasks — press 'a' to add)"}
        </Text>
      )}
      {visible.map((ht) => {
        const { task, indent, hasChildren, expanded } = ht;
        const selected = state.tasks[state.taskCursor]?.id === task.id;
        const marked = state.selectedTaskIds.includes(task.id);
        
        // Add indentation and expansion indicator to the first column (ID)
        const prefix = '  '.repeat(indent);
        const icon = hasChildren ? (expanded ? '▼ ' : '▶ ') : '  ';
        
        return (
          <ListItem
            key={task.id}
            selected={selected}
            focused={focused}
            marked={marked}
            columns={[
              { text: `${prefix}${icon}${task.id}`, width: 14 + (indent * 2) },
              ...taskColumns(task),
            ]}
          />
        );
      })}
    </Pane>
  );
}

function taskColumns(task: Task): Column[] {
  return [
    { text: `[${task.status.padEnd(11)}]`, color: theme.status[task.status], width: 14 },
    { text: `P${task.priority}`, color: theme.priority[task.priority] ?? 'white', width: 2 },
    { text: task.title },
  ];
}
