import { useApp, useInput, type Key } from 'ink';
import { useStore } from '../store.js';
import { keymap, type ActionId, type KeymapMode } from '../config/keymap.js';

function canonicalKey(input: string, key: Key): string | null {
  if (key.escape) return 'esc';
  if (key.tab) return 'tab';
  if (key.return) return 'enter';
  if (key.upArrow) return 'up';
  if (key.downArrow) return 'down';
  if (key.leftArrow) return 'left';
  if (key.rightArrow) return 'right';
  if (key.backspace || key.delete) return null;
  if (key.ctrl && input) return `ctrl+${input.toLowerCase()}`;
  if (input === ' ') return 'space';
  if (input && input.length === 1) return input;
  return null;
}

/** Whether the current view is hosting a TextInput; in those views we should
 *  ignore typeable keys so they go to the input. */
function isInputMode(mode: KeymapMode): boolean {
  return (
    mode === 'quickadd' ||
    mode === 'edit' ||
    mode === 'search' ||
    mode === 'palette' ||
    mode === 'worklogadd' ||
    mode === 'depadd'
  );
}

function isTypeable(k: string): boolean {
  return k.length === 1 || k === 'space' || k === 'enter';
}

export function useKeymap(): void {
  const { state, actions } = useStore();
  const { exit } = useApp();

  useInput((input, key) => {
    const k = canonicalKey(input, key);
    if (!k) return;

    const activeMode: KeymapMode = state.helpOpen ? 'help' : (state.mode as KeymapMode);
    const bindings = keymap[activeMode] ?? [];

    if (isInputMode(activeMode) && isTypeable(k)) return;

    const match = bindings.find((b) => b.keys.includes(k));
    if (!match) return;

    runAction(match.action, state, actions, exit);
  });
}

export function runAction(
  action: ActionId,
  state: ReturnType<typeof useStore>['state'],
  actions: ReturnType<typeof useStore>['actions'],
  exit: () => void,
): void {
  switch (action) {
    case 'cursor.down':
      if (state.focus === 'tasks') actions.moveTaskCursor(1);
      else actions.moveProjectCursor(1);
      return;
    case 'cursor.up':
      if (state.focus === 'tasks') actions.moveTaskCursor(-1);
      else actions.moveProjectCursor(-1);
      return;
    case 'pane.toggle':
      actions.toggleFocus();
      return;
    case 'task.cycleStatus':
      if (state.focus === 'tasks') actions.cycleStatus();
      return;
    case 'entity.openDetail':
      if (state.mode === 'browse' && state.focus === 'projects') actions.openProjectDetail();
      else if (state.focus === 'tasks') actions.openDetail();
      return;
    case 'entity.openEdit':
      if (state.mode === 'projectdetail' || (state.mode === 'browse' && state.focus === 'projects')) {
        actions.openProjectEdit();
      } else {
        actions.openEdit();
      }
      return;
    case 'task.quickAdd':
      if (state.selectedProjectId) actions.setMode('quickadd');
      return;
    case 'task.toggleSelect':
      if (state.focus === 'tasks') actions.toggleTaskSelection();
      return;
    case 'task.clearSelection':
      actions.clearSelection();
      return;
    case 'mode.search.open':
      actions.setMode('search');
      return;
    case 'mode.palette.open':
      actions.setMode('palette');
      return;
    case 'mode.worklogAdd.open':
      if (state.mode === 'detail') actions.setMode('worklogadd');
      return;
    case 'mode.depBlocker.open':
      if (state.mode === 'detail') actions.openDepAdd('blocks');
      return;
    case 'mode.depDependency.open':
      if (state.mode === 'detail') actions.openDepAdd('depends_on');
      return;
    case 'help.toggle':
      actions.toggleHelp();
      return;
    case 'overlay.close':
      actions.closeOverlay();
      return;
    case 'app.quit':
      exit();
      return;
    case 'undo':
      actions.undo();
      return;
  }
}
