import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { theme } from '../config/theme.js';
import { TaskType, type TaskType as TaskTypeT } from '../../types/domain.js';
import { useFieldNav } from '../hooks/useFocusTrap.js';

const TYPES = TaskType.options;
const PRIORITIES = [1, 2, 3, 4, 5];
const FIELDS = ['title', 'description', 'priority', 'type'] as const;

export function EditTaskScreen() {
  const { state, actions } = useStore();
  const draft = state.editDraft;
  const { index, next, prev } = useFieldNav(FIELDS.length);

  useInput((input, key) => {
    if (key.tab && key.shift) {
      prev();
      return;
    }
    if (key.tab) {
      next();
      return;
    }
    // Ctrl+s saves regardless of focused field.
    if (key.ctrl && input === 's') {
      actions.saveEdit();
      return;
    }
    // Pickers respond to left/right.
    if (FIELDS[index] === 'priority' && draft) {
      if (key.leftArrow) {
        const cur = PRIORITIES.indexOf(draft.priority);
        actions.updateEditField('priority', PRIORITIES[(cur - 1 + PRIORITIES.length) % PRIORITIES.length]!);
        return;
      }
      if (key.rightArrow) {
        const cur = PRIORITIES.indexOf(draft.priority);
        actions.updateEditField('priority', PRIORITIES[(cur + 1) % PRIORITIES.length]!);
        return;
      }
    }
    if (FIELDS[index] === 'type' && draft) {
      if (key.leftArrow) {
        const cur = TYPES.indexOf(draft.type);
        actions.updateEditField('type', TYPES[(cur - 1 + TYPES.length) % TYPES.length]!);
        return;
      }
      if (key.rightArrow) {
        const cur = TYPES.indexOf(draft.type);
        actions.updateEditField('type', TYPES[(cur + 1) % TYPES.length]!);
        return;
      }
    }
  });

  if (!draft) return null;
  const focused = FIELDS[index];

  return (
    <Modal title={`Edit ${draft.taskId}`} footerHint="tab to move · ctrl+s save · esc cancel">
      <FieldRow
        label="title"
        focused={focused === 'title'}
        value={draft.title}
        onChange={(v) => actions.updateEditField('title', v)}
        onSubmit={() => next()}
      />
      <FieldRow
        label="description"
        focused={focused === 'description'}
        value={draft.description}
        onChange={(v) => actions.updateEditField('description', v)}
        onSubmit={() => next()}
      />
      <PickerRow
        label="priority"
        focused={focused === 'priority'}
        value={`P${draft.priority}`}
        hint="←/→ to change"
        color={theme.priority[draft.priority] ?? 'white'}
      />
      <PickerRow
        label="type"
        focused={focused === 'type'}
        value={draft.type}
        hint="←/→ to change"
        color={theme.type[draft.type as TaskTypeT]}
      />
    </Modal>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  onSubmit,
  focused,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  focused: boolean;
}) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={focused ? theme.accent : undefined}>
        {label}
      </Text>
      <Box>
        <Text color={focused ? theme.accent : 'gray'}>› </Text>
        {focused ? (
          <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
        ) : (
          <Text>{value || <Text dimColor>(empty)</Text>}</Text>
        )}
      </Box>
    </Box>
  );
}

function PickerRow({
  label,
  value,
  focused,
  hint,
  color,
}: {
  label: string;
  value: string;
  focused: boolean;
  hint: string;
  color?: string;
}) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={focused ? theme.accent : undefined}>
          {label}
        </Text>
        {focused && <Text dimColor>  {hint}</Text>}
      </Box>
      <Box>
        <Text color={focused ? theme.accent : 'gray'}>› </Text>
        <Text color={color} bold={focused}>
          {value}
        </Text>
      </Box>
    </Box>
  );
}
