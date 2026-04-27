import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from './store.js';
import { useKeymap } from './hooks/useKeymap.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { BrowseScreen } from './screens/BrowseScreen.js';
import { DetailScreen } from './screens/DetailScreen.js';
import { ProjectDetailScreen } from './screens/ProjectDetailScreen.js';
import { EditProjectScreen } from './screens/EditProjectScreen.js';
import { QuickAddScreen } from './screens/QuickAddScreen.js';
import { EditTaskScreen } from './screens/EditTaskScreen.js';
import { SearchScreen } from './screens/SearchScreen.js';
import { CommandPaletteScreen } from './screens/CommandPaletteScreen.js';
import { WorklogAddScreen } from './screens/WorklogAddScreen.js';
import { DepAddScreen } from './screens/DepAddScreen.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { Footer } from './primitives/Footer.js';
import { ToastStack } from './primitives/Toast.js';
import { theme } from './config/theme.js';

export function App() {
  useKeymap();
  const { state } = useStore();

  return (
    <Box flexDirection="column">
      <Header />
      <Body />
      {state.helpOpen && <HelpOverlay />}
      {state.error && (
        <Box marginTop={1}>
          <Text color={theme.error}>! {state.error}</Text>
        </Box>
      )}
      <ToastStack />
      <Footer />
    </Box>
  );
}

function Body() {
  const { state } = useStore();
  switch (state.mode) {
    case 'browse':
      return <BrowseScreen />;
    case 'detail':
      return <DetailScreen />;
    case 'projectdetail':
      return <ProjectDetailScreen />;
    case 'projectedit':
      return <EditProjectScreen />;
    case 'quickadd':
      return <QuickAddScreen />;
    case 'edit':
      return <EditTaskScreen />;
    case 'search':
      return <SearchScreen />;
    case 'palette':
      return <CommandPaletteScreen />;
    case 'worklogadd':
      return <WorklogAddScreen />;
    case 'depadd':
      return <DepAddScreen />;
    default:
      return <BrowseScreen />;
  }
}

const ARC_BANNER_FULL = [
  ' █████╗ ██████╗  ██████╗',
  '██╔══██╗██╔══██╗██╔════╝',
  '███████║██████╔╝██║     ',
  '██╔══██║██╔══██╗██║     ',
  '██║  ██║██║  ██║╚██████╗',
  '╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝',
];

function Header() {
  const { state } = useStore();
  const { breakpoint } = useTerminalSize();

  if (breakpoint === 'narrow') {
    return (
      <Box>
        <Text bold color={theme.accent}>arc</Text>
        <Text dimColor>
          {' '}· {state.selectedProjectId ?? 'no project'} · {state.mode}
        </Text>
      </Box>
    );
  }

  if (breakpoint === 'wide') {
    return (
      <Box flexDirection="column">
        {ARC_BANNER_FULL.map((line, i) => (
          <Text key={i} bold color={theme.accent}>{line}</Text>
        ))}
        <Text dimColor>· local-first project orchestrator</Text>
      </Box>
    );
  }

  // normal: 2 lines max
  return (
    <Box flexDirection="column">
      <Text bold color={theme.accent}>arc · {state.selectedProjectId ?? 'no project'}</Text>
      <Text dimColor>local-first project orchestrator</Text>
    </Box>
  );
}
