import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../config/theme.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface ModalProps {
  title: string;
  footerHint?: string;
  children: React.ReactNode;
  borderColor?: string;
}

export function Modal({ title, footerHint, children, borderColor }: ModalProps) {
  const { cols } = useTerminalSize();
  const width = Math.max(40, Math.min(cols - 4, 100));
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor ?? theme.border.focused}
      paddingX={1}
      width={width}
    >
      <Text bold color={theme.accent}>
        {title}
      </Text>
      <Box marginTop={1} flexDirection="column">
        {children}
      </Box>
      {footerHint && (
        <Box marginTop={1}>
          <Text dimColor>{footerHint}</Text>
        </Box>
      )}
    </Box>
  );
}
