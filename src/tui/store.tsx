import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Database } from 'better-sqlite3';
import type {
  Dependency,
  DependencyKind,
  Project,
  Task,
  TaskStatus,
  TaskType,
  Worklog,
} from '../types/domain.js';
import { ProjectService } from '../services/projectService.js';
import { TaskService, type TaskUpdateInput } from '../services/taskService.js';
import { nextStatus } from './config/statusModel.js';

export type Mode =
  | 'browse'
  | 'quickadd'
  | 'detail'
  | 'projectdetail'
  | 'projectedit'
  | 'edit'
  | 'search'
  | 'palette'
  | 'worklogadd'
  | 'depadd';

export type Focus = 'projects' | 'tasks';

export interface DetailData {
  task: Task;
  worklog: Worklog[];
  dependencies: Dependency[];
}

export interface EditDraft {
  taskId: string;
  title: string;
  description: string;
  priority: number;
  type: TaskType;
}

export interface ProjectEditDraft {
  id: string;
  name: string;
  description: string;
  tech_stack: string;
}

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
  /** epoch ms when this toast should be dismissed */
  expiresAt: number;
}

type UndoEntry =
  | { kind: 'status'; taskId: string; prevStatus: TaskStatus }
  | { kind: 'edit'; taskId: string; prevFields: TaskUpdateInput };

const UNDO_CAP = 20;
const TOAST_TTL_MS = 4000;

export interface State {
  projects: Project[];
  selectedProjectId: string | null;
  projectCursor: number;
  /** Tasks for the selected project, unfiltered. */
  tasks: Task[];
  taskCursor: number;
  focus: Focus;
  mode: Mode;
  detail: DetailData | null;
  error: string | null;

  helpOpen: boolean;
  searchQuery: string;
  selectedTaskIds: string[];
  editDraft: EditDraft | null;
  projectEditDraft: ProjectEditDraft | null;
  depKind: DependencyKind | null;
  toasts: Toast[];
  undoStack: UndoEntry[];
}

type Action =
  | { type: 'LOAD'; projects: Project[]; tasks: Task[]; selectedProjectId: string | null }
  | { type: 'SELECT_PROJECT'; cursor: number }
  | { type: 'REFRESH_TASKS'; tasks: Task[] }
  | { type: 'MOVE_TASK_CURSOR'; delta: number }
  | { type: 'SET_TASK_CURSOR'; cursor: number }
  | { type: 'TOGGLE_FOCUS' }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_DETAIL'; detail: DetailData | null }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_HELP' }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'TOGGLE_SELECT'; taskId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_EDIT_DRAFT'; draft: EditDraft | null }
  | { type: 'UPDATE_EDIT_FIELD'; field: keyof Omit<EditDraft, 'taskId'>; value: string | number }
  | { type: 'SET_PROJECT_EDIT_DRAFT'; draft: ProjectEditDraft | null }
  | { type: 'UPDATE_PROJECT_EDIT_FIELD'; field: keyof Omit<ProjectEditDraft, 'id'>; value: string }
  | { type: 'SET_DEP_KIND'; kind: DependencyKind | null }
  | { type: 'PUSH_TOAST'; toast: Toast }
  | { type: 'DISMISS_TOAST'; id: number }
  | { type: 'PUSH_UNDO'; entry: UndoEntry }
  | { type: 'POP_UNDO' };

let toastSeq = 0;
const nextToastId = (): number => ++toastSeq;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        projects: action.projects,
        tasks: action.tasks,
        selectedProjectId: action.selectedProjectId,
        projectCursor: Math.max(
          0,
          action.projects.findIndex((p) => p.id === action.selectedProjectId),
        ),
        taskCursor: 0,
      };
    case 'SELECT_PROJECT': {
      const cursor = clamp(action.cursor, 0, state.projects.length - 1);
      const project = state.projects[cursor];
      return {
        ...state,
        projectCursor: cursor,
        selectedProjectId: project?.id ?? null,
        taskCursor: 0,
        selectedTaskIds: [],
      };
    }
    case 'REFRESH_TASKS':
      return {
        ...state,
        tasks: action.tasks,
        taskCursor: clamp(state.taskCursor, 0, Math.max(0, action.tasks.length - 1)),
      };
    case 'MOVE_TASK_CURSOR':
      return {
        ...state,
        taskCursor: clamp(state.taskCursor + action.delta, 0, Math.max(0, state.tasks.length - 1)),
      };
    case 'SET_TASK_CURSOR':
      return {
        ...state,
        taskCursor: clamp(action.cursor, 0, Math.max(0, state.tasks.length - 1)),
      };
    case 'TOGGLE_FOCUS':
      return { ...state, focus: state.focus === 'projects' ? 'tasks' : 'projects' };
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'SET_DETAIL':
      return { ...state, detail: action.detail };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'TOGGLE_HELP':
      return { ...state, helpOpen: !state.helpOpen };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    case 'TOGGLE_SELECT': {
      const set = new Set(state.selectedTaskIds);
      if (set.has(action.taskId)) set.delete(action.taskId);
      else set.add(action.taskId);
      return { ...state, selectedTaskIds: Array.from(set) };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedTaskIds: [] };
    case 'SET_EDIT_DRAFT':
      return { ...state, editDraft: action.draft };
    case 'UPDATE_EDIT_FIELD': {
      if (!state.editDraft) return state;
      return { ...state, editDraft: { ...state.editDraft, [action.field]: action.value } };
    }
    case 'SET_PROJECT_EDIT_DRAFT':
      return { ...state, projectEditDraft: action.draft };
    case 'UPDATE_PROJECT_EDIT_FIELD': {
      if (!state.projectEditDraft) return state;
      return {
        ...state,
        projectEditDraft: { ...state.projectEditDraft, [action.field]: action.value },
      };
    }
    case 'SET_DEP_KIND':
      return { ...state, depKind: action.kind };
    case 'PUSH_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'PUSH_UNDO': {
      const next = [...state.undoStack, action.entry];
      if (next.length > UNDO_CAP) next.shift();
      return { ...state, undoStack: next };
    }
    case 'POP_UNDO':
      return { ...state, undoStack: state.undoStack.slice(0, -1) };
    default:
      return state;
  }
}

function clamp(n: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, n));
}

interface StoreContextValue {
  state: State;
  actions: {
    reload(initialProjectId?: string | null): void;
    selectProject(cursor: number): void;
    moveProjectCursor(delta: number): void;
    moveTaskCursor(delta: number): void;
    setTaskCursor(cursor: number): void;
    toggleFocus(): void;
    cycleStatus(): void;
    quickAdd(title: string): void;
    openDetail(): void;
    closeDetail(): void;
    setMode(mode: Mode): void;
    closeOverlay(): void;
    toggleHelp(): void;
    setSearchQuery(q: string): void;
    toggleTaskSelection(): void;
    clearSelection(): void;
    bulkCycleStatus(): void;
    openEdit(): void;
    updateEditField(field: keyof Omit<EditDraft, 'taskId'>, value: string | number): void;
    saveEdit(): void;
    openProjectDetail(): void;
    openProjectEdit(): void;
    updateProjectEditField(field: keyof Omit<ProjectEditDraft, 'id'>, value: string): void;
    saveProjectEdit(): void;
    saveWorklog(message: string): void;
    openDepAdd(kind: DependencyKind): void;
    saveDep(targetId: string): void;
    pushToast(kind: Toast['kind'], message: string): void;
    dismissToast(id: number): void;
    undo(): void;
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  db,
  initialProjectId,
  children,
}: {
  db: Database;
  initialProjectId: string | null;
  children: React.ReactNode;
}) {
  const projectService = useMemo(() => new ProjectService(db), [db]);
  const taskService = useMemo(() => new TaskService(db), [db]);

  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState(projectService, taskService, initialProjectId),
  );

  const actions = useMemo<StoreContextValue['actions']>(
    () => buildActions(state, dispatch, projectService, taskService),
    [projectService, taskService, state],
  );

  return <StoreContext.Provider value={{ state, actions }}>{children}</StoreContext.Provider>;
}

function buildActions(
  state: State,
  dispatch: React.Dispatch<Action>,
  projectService: ProjectService,
  taskService: TaskService,
): StoreContextValue['actions'] {
  const refreshTasks = (projectId: string | null): Task[] => {
    if (!projectId) return [];
    const tasks = taskService.list({ project_id: projectId });
    dispatch({ type: 'REFRESH_TASKS', tasks });
    return tasks;
  };

  const refreshDetail = (taskId: string): DetailData | null => {
    try {
      const detail = taskService.getWithWorklog(taskId);
      const { worklog, ...rest } = detail;
      const dependencies = taskService.listDependencies(taskId);
      const data: DetailData = { task: rest, worklog, dependencies };
      dispatch({ type: 'SET_DETAIL', detail: data });
      return data;
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      return null;
    }
  };

  const pushToast = (kind: Toast['kind'], message: string): void => {
    dispatch({
      type: 'PUSH_TOAST',
      toast: {
        id: nextToastId(),
        kind,
        message,
        expiresAt: Date.now() + TOAST_TTL_MS,
      },
    });
  };

  return {
    reload(targetId) {
      const projects = projectService.list();
      const projectId = targetId ?? state.selectedProjectId ?? projects[0]?.id ?? null;
      const tasks = projectId ? taskService.list({ project_id: projectId }) : [];
      dispatch({ type: 'LOAD', projects, tasks, selectedProjectId: projectId });
    },
    selectProject(cursor) {
      dispatch({ type: 'SELECT_PROJECT', cursor });
      const project = state.projects[cursor];
      if (project) refreshTasks(project.id);
    },
    moveProjectCursor(delta) {
      const newCursor = state.projectCursor + delta;
      if (newCursor < 0 || newCursor >= state.projects.length) return;
      dispatch({ type: 'SELECT_PROJECT', cursor: newCursor });
      const project = state.projects[newCursor];
      if (project) refreshTasks(project.id);
    },
    moveTaskCursor(delta) {
      dispatch({ type: 'MOVE_TASK_CURSOR', delta });
    },
    setTaskCursor(cursor) {
      dispatch({ type: 'SET_TASK_CURSOR', cursor });
    },
    toggleFocus() {
      dispatch({ type: 'TOGGLE_FOCUS' });
    },
    cycleStatus() {
      const task = state.tasks[state.taskCursor];
      if (!task) return;
      const target = nextStatus(task.status);
      try {
        const prevStatus = task.status;
        taskService.updateStatus(task.id, target);
        dispatch({ type: 'PUSH_UNDO', entry: { kind: 'status', taskId: task.id, prevStatus } });
        refreshTasks(state.selectedProjectId);
        pushToast('info', `${task.id} → ${target} · u to undo`);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      }
    },
    quickAdd(title) {
      if (!title.trim() || !state.selectedProjectId) {
        dispatch({ type: 'SET_MODE', mode: 'browse' });
        return;
      }
      try {
        const created = taskService.create({
          project_id: state.selectedProjectId,
          title: title.trim(),
        });
        refreshTasks(state.selectedProjectId);
        dispatch({ type: 'SET_MODE', mode: 'browse' });
        pushToast('success', `created ${created.id}`);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      }
    },
    openDetail() {
      const task = state.tasks[state.taskCursor];
      if (!task) return;
      const data = refreshDetail(task.id);
      if (data) dispatch({ type: 'SET_MODE', mode: 'detail' });
    },
    closeDetail() {
      dispatch({ type: 'SET_DETAIL', detail: null });
      dispatch({ type: 'SET_MODE', mode: 'browse' });
    },
    setMode(mode) {
      dispatch({ type: 'SET_MODE', mode });
    },
    closeOverlay() {
      // Pop the topmost overlay back to the appropriate base mode.
      const current = state.mode;
      if (current === 'edit' || current === 'worklogadd' || current === 'depadd') {
        dispatch({ type: 'SET_EDIT_DRAFT', draft: null });
        dispatch({ type: 'SET_DEP_KIND', kind: null });
        dispatch({ type: 'SET_MODE', mode: state.detail ? 'detail' : 'browse' });
        return;
      }
      if (current === 'projectedit') {
        dispatch({ type: 'SET_PROJECT_EDIT_DRAFT', draft: null });
        dispatch({ type: 'SET_MODE', mode: 'projectdetail' });
        return;
      }
      if (current === 'search') {
        dispatch({ type: 'SET_SEARCH', query: '' });
        dispatch({ type: 'SET_MODE', mode: 'browse' });
        return;
      }
      if (current === 'palette') {
        dispatch({ type: 'SET_MODE', mode: 'browse' });
        return;
      }
      if (current === 'detail' || current === 'projectdetail') {
        dispatch({ type: 'SET_DETAIL', detail: null });
        dispatch({ type: 'SET_MODE', mode: 'browse' });
        return;
      }
      if (current === 'quickadd') {
        dispatch({ type: 'SET_MODE', mode: 'browse' });
        return;
      }
    },
    toggleHelp() {
      dispatch({ type: 'TOGGLE_HELP' });
    },
    setSearchQuery(q) {
      dispatch({ type: 'SET_SEARCH', query: q });
    },
    toggleTaskSelection() {
      const task = state.tasks[state.taskCursor];
      if (!task) return;
      dispatch({ type: 'TOGGLE_SELECT', taskId: task.id });
    },
    clearSelection() {
      dispatch({ type: 'CLEAR_SELECTION' });
    },
    bulkCycleStatus() {
      if (state.selectedTaskIds.length === 0) {
        return;
      }
      let changed = 0;
      for (const id of state.selectedTaskIds) {
        const task = state.tasks.find((t) => t.id === id);
        if (!task) continue;
        const target = nextStatus(task.status);
        try {
          taskService.updateStatus(task.id, target);
          changed++;
        } catch {
          // skip individual failures, surface aggregate
        }
      }
      refreshTasks(state.selectedProjectId);
      pushToast('info', `cycled ${changed} task(s)`);
      dispatch({ type: 'CLEAR_SELECTION' });
    },
    openEdit() {
      // Edit either the detail's task (if open) or the cursor task in browse.
      const task = state.detail?.task ?? state.tasks[state.taskCursor];
      if (!task) return;
      dispatch({
        type: 'SET_EDIT_DRAFT',
        draft: {
          taskId: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          type: task.type,
        },
      });
      dispatch({ type: 'SET_MODE', mode: 'edit' });
    },
    updateEditField(field, value) {
      dispatch({ type: 'UPDATE_EDIT_FIELD', field, value });
    },
    saveEdit() {
      const draft = state.editDraft;
      if (!draft) return;
      try {
        const before = taskService.get(draft.taskId);
        const prevFields: TaskUpdateInput = {
          title: before.title,
          description: before.description,
          priority: before.priority,
          type: before.type,
        };
        taskService.update(draft.taskId, {
          title: draft.title,
          description: draft.description,
          priority: draft.priority,
          type: draft.type,
        });
        dispatch({
          type: 'PUSH_UNDO',
          entry: { kind: 'edit', taskId: draft.taskId, prevFields },
        });
        refreshTasks(state.selectedProjectId);
        if (state.detail) refreshDetail(draft.taskId);
        dispatch({ type: 'SET_EDIT_DRAFT', draft: null });
        dispatch({ type: 'SET_MODE', mode: state.detail ? 'detail' : 'browse' });
        pushToast('success', `saved ${draft.taskId}`);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      }
    },
    openProjectDetail() {
      const project = state.projects[state.projectCursor];
      if (!project) return;
      dispatch({ type: 'SET_MODE', mode: 'projectdetail' });
    },
    openProjectEdit() {
      const project =
        state.mode === 'projectdetail'
          ? state.projects.find((p) => p.id === state.selectedProjectId)
          : state.projects[state.projectCursor];
      if (!project) return;
      dispatch({
        type: 'SET_PROJECT_EDIT_DRAFT',
        draft: {
          id: project.id,
          name: project.name,
          description: project.description,
          tech_stack: project.tech_stack,
        },
      });
      dispatch({ type: 'SET_MODE', mode: 'projectedit' });
    },
    updateProjectEditField(field, value) {
      dispatch({ type: 'UPDATE_PROJECT_EDIT_FIELD', field, value });
    },
    saveProjectEdit() {
      const draft = state.projectEditDraft;
      if (!draft) return;
      try {
        projectService.update(draft.id, {
          name: draft.name,
          description: draft.description,
          tech_stack: draft.tech_stack,
        });
        // Refresh project list so the new name shows immediately.
        const projects = projectService.list();
        dispatch({
          type: 'LOAD',
          projects,
          tasks: state.tasks,
          selectedProjectId: state.selectedProjectId,
        });
        dispatch({ type: 'SET_PROJECT_EDIT_DRAFT', draft: null });
        dispatch({ type: 'SET_MODE', mode: 'projectdetail' });
        pushToast('success', `saved project ${draft.id}`);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      }
    },
    saveWorklog(message) {
      const taskId = state.detail?.task.id;
      if (!taskId || !message.trim()) {
        dispatch({ type: 'SET_MODE', mode: state.detail ? 'detail' : 'browse' });
        return;
      }
      try {
        taskService.log(taskId, message.trim());
        refreshDetail(taskId);
        dispatch({ type: 'SET_MODE', mode: 'detail' });
        pushToast('success', `worklog added to ${taskId}`);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      }
    },
    openDepAdd(kind) {
      if (!state.detail) return;
      dispatch({ type: 'SET_DEP_KIND', kind });
      dispatch({ type: 'SET_MODE', mode: 'depadd' });
    },
    saveDep(targetId) {
      const taskId = state.detail?.task.id;
      const kind = state.depKind;
      if (!taskId || !kind) {
        dispatch({ type: 'SET_MODE', mode: state.detail ? 'detail' : 'browse' });
        return;
      }
      try {
        taskService.addDependency(taskId, targetId, kind);
        refreshDetail(taskId);
        dispatch({ type: 'SET_DEP_KIND', kind: null });
        dispatch({ type: 'SET_MODE', mode: 'detail' });
        pushToast('success', `${kind} ${targetId} added`);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      }
    },
    pushToast,
    dismissToast(id) {
      dispatch({ type: 'DISMISS_TOAST', id });
    },
    undo() {
      const entry = state.undoStack[state.undoStack.length - 1];
      if (!entry) {
        pushToast('info', 'nothing to undo');
        return;
      }
      try {
        if (entry.kind === 'status') {
          taskService.updateStatus(entry.taskId, entry.prevStatus);
          pushToast('info', `${entry.taskId} → ${entry.prevStatus}`);
        } else if (entry.kind === 'edit') {
          taskService.update(entry.taskId, entry.prevFields);
          pushToast('info', `${entry.taskId} edit reverted`);
        }
        dispatch({ type: 'POP_UNDO' });
        refreshTasks(state.selectedProjectId);
        if (state.detail?.task.id === entry.taskId) refreshDetail(entry.taskId);
      } catch (e) {
        dispatch({ type: 'SET_ERROR', error: errMsg(e) });
      }
    },
  };
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function initialState(
  projectService: ProjectService,
  taskService: TaskService,
  initialProjectId: string | null,
): State {
  const projects = projectService.list();
  const projectId = initialProjectId ?? projects[0]?.id ?? null;
  const tasks = projectId ? taskService.list({ project_id: projectId }) : [];
  return {
    projects,
    selectedProjectId: projectId,
    projectCursor: Math.max(0, projects.findIndex((p) => p.id === projectId)),
    tasks,
    taskCursor: 0,
    focus: 'tasks',
    mode: 'browse',
    detail: null,
    error: null,
    helpOpen: false,
    searchQuery: '',
    selectedTaskIds: [],
    editDraft: null,
    projectEditDraft: null,
    depKind: null,
    toasts: [],
    undoStack: [],
  };
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

/** Tasks filtered by current search query (case-insensitive against id/title/status). */
export function filteredTasks(state: State): Task[] {
  const q = state.searchQuery.trim().toLowerCase();
  if (!q) return state.tasks;
  return state.tasks.filter((t) =>
    t.id.toLowerCase().includes(q) ||
    t.title.toLowerCase().includes(q) ||
    t.status.toLowerCase().includes(q) ||
    t.type.toLowerCase().includes(q),
  );
}
