import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { keymap, type KeymapMode } from '../config/keymap.js';
import { theme } from '../config/theme.js';

const MODE_TITLE: Record<KeymapMode, string> = {
  browse: 'Browse',
  detail: 'Task detail',
  projectdetail: 'Project detail',
  projectedit: 'Edit project',
  quickadd: 'Quick add',
  edit: 'Edit task',
  search: 'Search',
  palette: 'Command palette',
  worklogadd: 'Worklog',
  depadd: 'Dependency',
  help: 'Help',
};

export function HelpOverlay() {
  const { state } = useStore();
  // Show keymap for the mode underneath the help overlay, not 'help' itself.
  const underlying: KeymapMode = state.mode as KeymapMode;
  const bindings = keymap[underlying] ?? [];
  const globalAlways = ['?', 'ctrl+p'];

  return (
    <Modal title={`Help — ${MODE_TITLE[underlying] ?? underlying}`} footerHint="? or esc to close">
      <Box flexDirection="column">
        {bindings.map((b) => (
          <Text key={b.action}>
            <Text color={theme.accent}>{pad(b.label, 8)}</Text>
            <Text>{b.description}</Text>
          </Text>
        ))}
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>Always available:</Text>
          {globalAlways.map((k) => (
            <Text key={k}>
              <Text color={theme.accent}>{pad(k, 8)}</Text>
              <Text dimColor>{k === '?' ? 'toggle help' : 'command palette'}</Text>
            </Text>
          ))}
        </Box>
      </Box>
    </Modal>
  );
}

function pad(s: string, n: number): string {
  return s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length);
}
