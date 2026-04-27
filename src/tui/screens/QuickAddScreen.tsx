import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { theme } from '../config/theme.js';

export function QuickAddScreen() {
  const { state, actions } = useStore();
  const [value, setValue] = useState('');

  return (
    <Modal
      title={`New task in ${state.selectedProjectId ?? '?'}`}
      footerHint="enter to save · esc to cancel"
    >
      <Box>
        <Text color={theme.accent}>title › </Text>
        <TextInput value={value} onChange={setValue} onSubmit={(v) => actions.quickAdd(v)} />
      </Box>
    </Modal>
  );
}
