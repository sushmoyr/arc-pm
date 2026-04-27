import React from 'react';
import { Box, Text, type BoxProps } from 'ink';
import { theme } from '../config/theme.js';

interface PaneProps {
  title?: string;
  focused?: boolean;
  width?: BoxProps['width'];
  flexGrow?: number;
  borderColor?: string;
  children: React.ReactNode;
}

export function Pane({
  title,
  focused = false,
  width,
  flexGrow,
  borderColor,
  children,
}: PaneProps) {
  const color = borderColor ?? (focused ? theme.border.focused : theme.border.blurred);
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={color}
      paddingX={1}
      width={width}
      flexGrow={flexGrow}
    >
      {title && (
        <Text bold color={focused ? theme.accent : undefined}>
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
}
