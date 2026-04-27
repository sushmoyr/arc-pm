import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store.js';
import { theme } from '../config/theme.js';

const KIND_COLOR: Record<'success' | 'error' | 'info', string> = {
  success: theme.success,
  error: theme.error,
  info: theme.accent,
};

const KIND_GLYPH: Record<'success' | 'error' | 'info', string> = {
  success: '✓',
  error: '!',
  info: 'ℹ',
};

export function ToastStack() {
  const { state, actions } = useStore();

  useEffect(() => {
    if (state.toasts.length === 0) return;
    const next = Math.min(...state.toasts.map((t) => t.expiresAt));
    const remaining = Math.max(0, next - Date.now());
    const timer = setTimeout(() => {
      const now = Date.now();
      for (const t of state.toasts) {
        if (t.expiresAt <= now) actions.dismissToast(t.id);
      }
    }, remaining + 10);
    return () => clearTimeout(timer);
  }, [state.toasts, actions]);

  if (state.toasts.length === 0) return null;
  return (
    <Box flexDirection="column" marginTop={1}>
      {state.toasts.map((t) => (
        <Text key={t.id} color={KIND_COLOR[t.kind]}>
          {KIND_GLYPH[t.kind]} {t.message}
        </Text>
      ))}
    </Box>
  );
}
