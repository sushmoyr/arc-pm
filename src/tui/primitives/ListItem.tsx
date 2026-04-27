import React from 'react';
import { Box, Text } from 'ink';
import { theme, ELLIPSIS } from '../config/theme.js';

export interface Column {
  text: string;
  color?: string;
  width?: number;
  bold?: boolean;
  dim?: boolean;
}

interface ListItemProps {
  selected: boolean;
  focused: boolean;
  /** Multi-select state — shows ◉ instead of cursor when true. */
  marked?: boolean;
  columns: Column[];
  /** Total available width for the row (used to truncate the last column). */
  maxWidth?: number;
}

export function ListItem({ selected, focused, marked = false, columns, maxWidth }: ListItemProps) {
  const cursor = marked
    ? theme.cursor.selected
    : selected
      ? focused
        ? theme.cursor.focused
        : theme.cursor.blurred
      : theme.cursor.blank;

  // Reserve 2 chars for cursor + space.
  const cursorReserve = 2;
  let remaining = maxWidth ? Math.max(0, maxWidth - cursorReserve) : Infinity;

  const rendered = columns.map((c, i) => {
    const isLast = i === columns.length - 1;
    let text = c.text;
    if (c.width !== undefined) {
      text = text.length > c.width ? truncate(text, c.width) : text.padEnd(c.width);
    } else if (isLast && remaining !== Infinity) {
      text = text.length > remaining ? truncate(text, remaining) : text;
    }
    if (remaining !== Infinity) remaining = Math.max(0, remaining - text.length - 1);
    return { ...c, text };
  });

  return (
    <Box>
      <Text color={selected && focused ? theme.accent : undefined} bold={selected}>
        {cursor}
      </Text>
      {rendered.map((c, i) => (
        <Text
          key={i}
          color={c.color ?? (selected && focused ? theme.accent : undefined)}
          bold={c.bold ?? selected}
          dimColor={c.dim}
        >
          {c.text}
          {i < rendered.length - 1 ? ' ' : ''}
        </Text>
      ))}
    </Box>
  );
}

function truncate(s: string, width: number): string {
  if (width <= 0) return '';
  if (s.length <= width) return s;
  if (width === 1) return ELLIPSIS;
  return s.slice(0, width - 1) + ELLIPSIS;
}
