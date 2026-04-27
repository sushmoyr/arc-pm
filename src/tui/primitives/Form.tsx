import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { theme } from '../config/theme.js';

export interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  focused?: boolean;
  placeholder?: string;
  hint?: string;
}

export function Field({ label, value, onChange, onSubmit, focused = false, placeholder, hint }: FieldProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={focused ? theme.accent : undefined} bold={focused}>
          {label}
        </Text>
        {hint && (
          <Text dimColor>  {hint}</Text>
        )}
      </Box>
      <Box>
        <Text color={focused ? theme.accent : 'gray'}>› </Text>
        {focused ? (
          <TextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            placeholder={placeholder}
          />
        ) : (
          <Text>{value || (placeholder ? <Text dimColor>{placeholder}</Text> : '')}</Text>
        )}
      </Box>
    </Box>
  );
}
