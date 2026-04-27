import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store.js';
import { Modal } from '../primitives/Modal.js';
import { theme } from '../config/theme.js';
import { useFieldNav } from '../hooks/useFocusTrap.js';

const FIELDS = ['name', 'description', 'tech_stack'] as const;
type Field = (typeof FIELDS)[number];

export function EditProjectScreen() {
  const { state, actions } = useStore();
  const draft = state.projectEditDraft;
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
    if (key.ctrl && input === 's') {
      actions.saveProjectEdit();
    }
  });

  if (!draft) return null;
  const focused: Field = FIELDS[index]!;

  return (
    <Modal title={`Edit project ${draft.id}`} footerHint="tab to move · ctrl+s save · esc cancel">
      <ProjectField
        label="name"
        focused={focused === 'name'}
        value={draft.name}
        onChange={(v) => actions.updateProjectEditField('name', v)}
        onSubmit={next}
      />
      <ProjectField
        label="description"
        focused={focused === 'description'}
        value={draft.description}
        onChange={(v) => actions.updateProjectEditField('description', v)}
        onSubmit={next}
      />
      <ProjectField
        label="tech_stack"
        focused={focused === 'tech_stack'}
        value={draft.tech_stack}
        onChange={(v) => actions.updateProjectEditField('tech_stack', v)}
        onSubmit={() => actions.saveProjectEdit()}
      />
    </Modal>
  );
}

function ProjectField({
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
