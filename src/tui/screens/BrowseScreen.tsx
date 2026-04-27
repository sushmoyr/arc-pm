import React from 'react';
import { Box } from 'ink';
import { useStore } from '../store.js';
import { ProjectList } from '../components/ProjectList.js';
import { TaskBoard } from '../components/TaskBoard.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

export function BrowseScreen() {
  const { state } = useStore();
  const { cols, breakpoint } = useTerminalSize();

  if (breakpoint === 'narrow') {
    // Single-pane: tab toggles which pane is visible.
    return (
      <Box flexDirection="column">
        {state.focus === 'projects' ? <ProjectList flexGrow={1} /> : <TaskBoard flexGrow={1} />}
      </Box>
    );
  }

  const projectWidth = clamp(20, Math.floor(cols * 0.28), 36);
  return (
    <Box>
      <ProjectList width={projectWidth} />
      <TaskBoard flexGrow={1} />
    </Box>
  );
}

function clamp(min: number, n: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
