import React from 'react';
import { Box, Text } from 'ink';
import { keymap, type KeymapMode, type Binding } from '../config/keymap.js';
import { useStore } from '../store.js';
import { theme } from '../config/theme.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

export function Footer() {
  const { state } = useStore();
  const { cols } = useTerminalSize();

  const mode: KeymapMode = state.helpOpen ? 'help' : (state.mode as KeymapMode);
  const allBindings: Binding[] = keymap[mode] ?? [];
  const visible = allBindings.filter((b) => b.showInFooter);

  // Always include `?` and `Ctrl+P` as global hints (when not already shown).
  const globals: Array<[string, string]> = [];
  if (!visible.some((b) => b.action === 'help.toggle')) globals.push(['?', 'help']);
  if (!visible.some((b) => b.action === 'mode.palette.open')) globals.push(['⌃p', 'palette']);

  const parts = [
    ...visible.map<[string, string]>((b) => [b.label, b.description]),
    ...globals,
  ];

  // Greedy pack until we run out of space.
  let used = 0;
  const fit: typeof parts = [];
  for (const [k, d] of parts) {
    const segLen = k.length + 1 + d.length + 3; // " · "
    if (used + segLen > cols - 2) break;
    fit.push([k, d]);
    used += segLen;
  }

  return (
    <Box marginTop={1}>
      <Text dimColor>
        {fit
          .map(([k, d], i) => (
            <React.Fragment key={i}>
              <Text color={theme.accent}>{k}</Text>
              <Text dimColor> {d}</Text>
              {i < fit.length - 1 && <Text dimColor> · </Text>}
            </React.Fragment>
          ))
          /* render as siblings, no array wrapping */}
      </Text>
    </Box>
  );
}
