import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { theme } from '../config/theme.js';

export function WorklogAddScreen() {
  const { state, actions } = useStore();
  const [value, setValue] = useState('');
  const taskId = state.detail?.task.id ?? '?';

  return (
    <Modal title={`Log work on ${taskId}`} footerHint="enter to save · esc to cancel">
      <Box>
        <Text color={theme.accent}>message › </Text>
        <TextInput value={value} onChange={setValue} onSubmit={(v) => actions.saveWorklog(v)} />
      </Box>
    </Modal>
  );
}
