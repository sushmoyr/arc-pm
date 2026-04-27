import { z } from 'zod';
import {
  DependencyKind,
  NewProjectInput,
  NewTaskInput,
  TaskIdSchema,
} from './domain.js';

export const ImportDependency = z
  .object({
    task: TaskIdSchema.describe('Task id that owns the edge (e.g. "ARC-2").'),
    kind: DependencyKind.describe('Edge kind: blocks or depends_on.'),
    target: TaskIdSchema.describe('Target task id of the edge.'),
  })
  .describe('A single dependency edge between two tasks.');

export const ImportFile = z
  .object({
    projects: z
      .array(NewProjectInput)
      .default([])
      .describe('Projects to create. Skipped if a project with the same id already exists.'),
    tasks: z
      .array(NewTaskInput)
      .default([])
      .describe(
        'Tasks to create, in order. Each gets a freshly minted PROJECT-N id. Reference these ids in `dependencies`.',
      ),
    dependencies: z
      .array(ImportDependency)
      .default([])
      .describe('Dependency edges between tasks created above.'),
  })
  .describe('arc import file: batch-creates projects, tasks, and dependencies.');
export type ImportFile = z.infer<typeof ImportFile>;

export const ImportExample: ImportFile = {
  projects: [
    {
      id: 'ARC',
      name: 'ARC PM',
      description: 'Local-first PM CLI',
      tech_stack: 'Node 22, TypeScript, SQLite',
    },
  ],
  tasks: [
    {
      project_id: 'ARC',
      title: 'Implement auth',
      type: 'TASK',
      status: 'TODO',
      priority: 1,
      description: 'JWT-based auth middleware.',
      parent_id: null,
    },
    {
      project_id: 'ARC',
      title: 'Write auth tests',
      type: 'TASK',
      status: 'TODO',
      priority: 2,
      description: '',
      parent_id: null,
    },
  ],
  dependencies: [{ task: 'ARC-2', kind: 'depends_on', target: 'ARC-1' }],
};
