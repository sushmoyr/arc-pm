import type { TaskStatus } from '../../types/domain.js';

export const STATUS_CYCLE: readonly TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'BACKLOG',
] as const;

export const ALL_STATUSES: readonly TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
] as const;

export function nextStatus(current: TaskStatus): TaskStatus {
  const i = STATUS_CYCLE.indexOf(current);
  if (i < 0) return STATUS_CYCLE[0]!;
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length]!;
}

export function prevStatus(current: TaskStatus): TaskStatus {
  const i = STATUS_CYCLE.indexOf(current);
  if (i < 0) return STATUS_CYCLE[0]!;
  return STATUS_CYCLE[(i - 1 + STATUS_CYCLE.length) % STATUS_CYCLE.length]!;
}
