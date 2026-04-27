import React from 'react';
import { Text } from 'ink';
import { filteredTasks, useStore } from '../store.js';
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
  const visible = filteredTasks(state);
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
      {visible.map((t) => {
        const selected = state.tasks[state.taskCursor]?.id === t.id;
        const marked = state.selectedTaskIds.includes(t.id);
        return (
          <ListItem
            key={t.id}
            selected={selected}
            focused={focused}
            marked={marked}
            columns={taskColumns(t)}
          />
        );
      })}
    </Pane>
  );
}

function taskColumns(task: Task): Column[] {
  return [
    { text: task.id, width: 10 },
    { text: `[${task.status.padEnd(11)}]`, color: theme.status[task.status], width: 14 },
    { text: `P${task.priority}`, color: theme.priority[task.priority] ?? 'white', width: 2 },
    { text: task.title },
  ];
}
