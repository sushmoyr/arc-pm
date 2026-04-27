import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../store.js';
import { Pane } from '../primitives/Pane.js';
import { theme } from '../config/theme.js';

export function ProjectDetailScreen() {
  const { state } = useStore();
  const project =
    state.projects.find((p) => p.id === state.selectedProjectId) ??
    state.projects[state.projectCursor];
  if (!project) return null;

  const taskCount = state.tasks.length;

  return (
    <Pane focused borderColor={theme.border.focused}>
      <Text>
        <Text bold>{project.id}</Text>
        <Text dimColor>  · {taskCount} task(s)</Text>
      </Text>
      <Text bold>{project.name}</Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Description</Text>
        {project.description ? (
          <Text>{project.description}</Text>
        ) : (
          <Text dimColor>(no description)</Text>
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Tech stack</Text>
        {project.tech_stack ? (
          <Text>{project.tech_stack}</Text>
        ) : (
          <Text dimColor>(none)</Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>created {project.created_at} · updated {project.updated_at}</Text>
      </Box>
    </Pane>
  );
}
