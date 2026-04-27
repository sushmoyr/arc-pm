import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store.js';
import { Pane } from '../primitives/Pane.js';
import { theme } from '../config/theme.js';

export function DetailScreen() {
  const { state } = useStore();
  if (!state.detail) return null;
  const { task, worklog, dependencies } = state.detail;
  const blocks = dependencies.filter((d) => d.task_id === task.id && d.kind === 'blocks');
  const dependsOn = dependencies.filter((d) => d.task_id === task.id && d.kind === 'depends_on');
  const blockedBy = dependencies.filter((d) => d.target_id === task.id && d.kind === 'blocks');

  return (
    <Pane focused borderColor={theme.border.focused}>
      <Text>
        <Text bold>{task.id}</Text>{' · '}
        <Text color={theme.type[task.type]}>{task.type}</Text>{' · '}
        <Text color={theme.status[task.status]}>{task.status}</Text>{' · '}
        <Text color={theme.priority[task.priority] ?? 'white'}>P{task.priority}</Text>
      </Text>
      <Text bold>{task.title}</Text>
      <Box marginTop={1}>
        {task.description ? <Text>{task.description}</Text> : <Text dimColor>(no description)</Text>}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Dependencies</Text>
        {dependsOn.length === 0 && blocks.length === 0 && blockedBy.length === 0 && (
          <Text dimColor>  (none)</Text>
        )}
        {dependsOn.map((d) => (
          <Text key={`do-${d.target_id}`}>
            <Text dimColor>  depends on  </Text>
            <Text color={theme.accent}>{d.target_id}</Text>
          </Text>
        ))}
        {blocks.map((d) => (
          <Text key={`bl-${d.target_id}`}>
            <Text dimColor>  blocks      </Text>
            <Text color={theme.warning}>{d.target_id}</Text>
          </Text>
        ))}
        {blockedBy.map((d) => (
          <Text key={`bb-${d.task_id}`}>
            <Text dimColor>  blocked by  </Text>
            <Text color={theme.error}>{d.task_id}</Text>
          </Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Worklog</Text>
        {worklog.length === 0 ? (
          <Text dimColor>  (none)</Text>
        ) : (
          worklog.map((w) => (
            <Text key={w.id}>
              <Text dimColor>  {w.created_at}  </Text>
              {w.message}
            </Text>
          ))
        )}
      </Box>
    </Pane>
  );
}
