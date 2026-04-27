import { z } from 'zod';

export const TaskStatus = z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskType = z.enum(['EPIC', 'STORY', 'TASK', 'BUG']);
export type TaskType = z.infer<typeof TaskType>;

export const Priority = z.number().int().min(1).max(5);
export type Priority = z.infer<typeof Priority>;

export const DependencyKind = z.enum(['blocks', 'depends_on']);
export type DependencyKind = z.infer<typeof DependencyKind>;

export const ProjectIdSchema = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[A-Z][A-Z0-9]*$/, 'project id must be uppercase letters/digits, starting with a letter');
export type ProjectId = z.infer<typeof ProjectIdSchema>;

export const TaskIdSchema = z.string().regex(/^[A-Z][A-Z0-9]*-\d+$/, 'task id must be PROJECT-N');
export type TaskId = z.infer<typeof TaskIdSchema>;

export const Project = z.object({
  id: ProjectIdSchema,
  name: z.string().min(1),
  description: z.string().default(''),
  tech_stack: z.string().default(''),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Project = z.infer<typeof Project>;

export const Task = z.object({
  id: TaskIdSchema,
  project_id: ProjectIdSchema,
  parent_id: TaskIdSchema.nullable(),
  type: TaskType,
  title: z.string().min(1),
  description: z.string().default(''),
  status: TaskStatus,
  priority: Priority,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Task = z.infer<typeof Task>;

export const Worklog = z.object({
  id: z.number().int(),
  task_id: TaskIdSchema,
  message: z.string(),
  created_at: z.string(),
});
export type Worklog = z.infer<typeof Worklog>;

export const Dependency = z.object({
  task_id: TaskIdSchema,
  target_id: TaskIdSchema,
  kind: DependencyKind,
});
export type Dependency = z.infer<typeof Dependency>;

export const NewTaskInput = z.object({
  project_id: ProjectIdSchema,
  parent_id: TaskIdSchema.nullable().default(null),
  type: TaskType.default('TASK'),
  title: z.string().min(1),
  description: z.string().default(''),
  status: TaskStatus.default('TODO'),
  priority: Priority.default(3),
});
export type NewTaskInput = z.infer<typeof NewTaskInput>;

export const NewProjectInput = z.object({
  id: ProjectIdSchema,
  name: z.string().min(1),
  description: z.string().default(''),
  tech_stack: z.string().default(''),
});
export type NewProjectInput = z.infer<typeof NewProjectInput>;
