import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { theme } from '../config/theme.js';

export function DepAddScreen() {
  const { state, actions } = useStore();
  const [value, setValue] = useState('');
  const taskId = state.detail?.task.id ?? '?';
  const kind = state.depKind ?? 'blocks';
  const verb = kind === 'blocks' ? 'blocks' : 'depends on';

  // Suggest tasks from the same project.
  const suggestions = state.tasks.filter(
    (t) => t.id !== taskId && t.id.toLowerCase().includes(value.trim().toLowerCase()),
  );

  return (
    <Modal
      title={`${taskId} ${verb} …`}
      footerHint="type task id · enter to save · esc to cancel"
    >
      <Box>
        <Text color={theme.accent}>target › </Text>
        <TextInput value={value} onChange={setValue} onSubmit={(v) => actions.saveDep(v.trim())} />
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {suggestions.slice(0, 6).map((t) => (
          <Text key={t.id}>
            <Text dimColor>  </Text>
            <Text color={theme.accent}>{t.id}</Text>{' '}
            <Text>{t.title}</Text>
          </Text>
        ))}
      </Box>
    </Modal>
  );
}
