import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore, filteredTasks } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { theme } from '../config/theme.js';

export function SearchScreen() {
  const { state, actions } = useStore();
  const matches = filteredTasks(state);

  return (
    <Modal
      title="Search tasks"
      footerHint="type to filter · enter to jump · esc to clear"
    >
      <Box>
        <Text color={theme.accent}>/ </Text>
        <TextInput
          value={state.searchQuery}
          onChange={actions.setSearchQuery}
          onSubmit={() => {
            // Jump to first match in TaskBoard, then close.
            const firstId = matches[0]?.id;
            if (firstId) {
              const idx = state.tasks.findIndex((t) => t.id === firstId);
              if (idx >= 0) actions.setTaskCursor(idx);
            }
            actions.setMode('browse');
          }}
        />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>{matches.length} match(es)</Text>
      </Box>
      <Box flexDirection="column">
        {matches.slice(0, 10).map((t) => (
          <Text key={t.id}>
            <Text color={theme.accent}>{t.id}</Text>{' '}
            <Text color={theme.status[t.status]}>[{t.status}]</Text>{' '}
            <Text>{t.title}</Text>
          </Text>
        ))}
        {matches.length > 10 && <Text dimColor>… {matches.length - 10} more</Text>}
      </Box>
    </Modal>
  );
}
