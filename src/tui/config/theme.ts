import type { TaskStatus, TaskType } from '../../types/domain.js';

export const theme = {
  border: {
    focused: 'cyan',
    blurred: 'gray',
    accent: 'magenta',
  },
  cursor: {
    focused: '▶',
    blurred: '·',
    blank: ' ',
    selected: '◉',
    unselected: ' ',
  },
  status: {
    BACKLOG: 'gray',
    TODO: 'white',
    IN_PROGRESS: 'cyan',
    REVIEW: 'yellow',
    DONE: 'green',
  } satisfies Record<TaskStatus, string>,
  type: {
    EPIC: 'magenta',
    STORY: 'blue',
    TASK: 'white',
    BUG: 'red',
  } satisfies Record<TaskType, string>,
  priority: {
    1: 'red',
    2: 'yellow',
    3: 'white',
    4: 'gray',
    5: 'gray',
  } as Record<number, string>,
  accent: 'cyan',
  error: 'red',
  success: 'green',
  warning: 'yellow',
  muted: 'gray',
} as const;

export const ELLIPSIS = '…';
