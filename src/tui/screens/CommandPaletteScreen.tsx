import React, { useState, useMemo } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { theme } from '../config/theme.js';
import { paletteActions, type Binding } from '../config/keymap.js';
import { runAction } from '../hooks/useKeymap.js';

export function CommandPaletteScreen() {
  const { state, actions } = useStore();
  const { exit } = useApp();
  const [query, setQuery] = useState('');

  const all = useMemo(() => paletteActions(), []);
  const matches = useMemo(() => filterActions(all, query), [all, query]);

  return (
    <Modal title="Command palette" footerHint="type to filter · enter to run · esc to cancel">
      <Box>
        <Text color={theme.accent}>› </Text>
        <TextInput
          value={query}
          onChange={setQuery}
          onSubmit={() => {
            const first = matches[0];
            // Close palette before running so the new state is committed cleanly.
            actions.setMode('browse');
            if (first) runAction(first.action, state, actions, exit);
          }}
        />
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {matches.length === 0 && <Text dimColor>(no matches)</Text>}
        {matches.slice(0, 10).map((b, i) => (
          <Text key={b.action}>
            <Text color={i === 0 ? theme.accent : undefined} bold={i === 0}>
              {i === 0 ? '▶ ' : '  '}
              {b.description}
            </Text>
            <Text dimColor>  {b.label}</Text>
          </Text>
        ))}
      </Box>
    </Modal>
  );
}

function filterActions(all: Binding[], q: string): Binding[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return all;
  const score = (b: Binding): number => {
    const hay = (b.description + ' ' + b.action + ' ' + b.label).toLowerCase();
    if (!hay.includes(needle)) return -1;
    return hay.indexOf(needle);
  };
  return all
    .map((b) => ({ b, s: score(b) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s)
    .map((x) => x.b);
}
