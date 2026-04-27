export type ActionId =
  | 'cursor.down'
  | 'cursor.up'
  | 'pane.toggle'
  | 'task.cycleStatus'
  | 'entity.openDetail'
  | 'entity.openEdit'
  | 'task.quickAdd'
  | 'task.toggleSelect'
  | 'task.clearSelection'
  | 'mode.search.open'
  | 'mode.palette.open'
  | 'mode.worklogAdd.open'
  | 'mode.depBlocker.open'
  | 'mode.depDependency.open'
  | 'help.toggle'
  | 'overlay.close'
  | 'app.quit'
  | 'undo';

export type KeymapMode =
  | 'browse'
  | 'detail'
  | 'projectdetail'
  | 'projectedit'
  | 'quickadd'
  | 'edit'
  | 'search'
  | 'palette'
  | 'worklogadd'
  | 'depadd'
  | 'help';

export interface Binding {
  keys: string[];
  action: ActionId;
  label: string;
  description: string;
  showInFooter?: boolean;
  /** When true, available in palette regardless of current mode. */
  paletteGlobal?: boolean;
}

const browseBindings: Binding[] = [
  { keys: ['j', 'down'], action: 'cursor.down', label: 'j/↓', description: 'down', showInFooter: true },
  { keys: ['k', 'up'], action: 'cursor.up', label: 'k/↑', description: 'up', showInFooter: true },
  { keys: ['tab'], action: 'pane.toggle', label: 'tab', description: 'swap pane', showInFooter: true },
  { keys: ['enter'], action: 'entity.openDetail', label: '↵', description: 'open detail', showInFooter: true },
  { keys: ['a'], action: 'task.quickAdd', label: 'a', description: 'add task', showInFooter: true },
  { keys: ['s'], action: 'task.cycleStatus', label: 's', description: 'cycle status', showInFooter: true },
  { keys: ['e'], action: 'entity.openEdit', label: 'e', description: 'edit', showInFooter: true, paletteGlobal: true },
  { keys: ['space'], action: 'task.toggleSelect', label: '␣', description: 'toggle select' },
  { keys: ['/'], action: 'mode.search.open', label: '/', description: 'search', showInFooter: true, paletteGlobal: true },
  { keys: ['?'], action: 'help.toggle', label: '?', description: 'help', showInFooter: true, paletteGlobal: true },
  { keys: ['ctrl+p'], action: 'mode.palette.open', label: '⌃p', description: 'command palette', paletteGlobal: true },
  { keys: ['u'], action: 'undo', label: 'u', description: 'undo', paletteGlobal: true },
  { keys: ['q'], action: 'app.quit', label: 'q', description: 'quit', showInFooter: true },
];

const detailBindings: Binding[] = [
  { keys: ['esc', 'q'], action: 'overlay.close', label: 'esc/q', description: 'close', showInFooter: true },
  { keys: ['e'], action: 'entity.openEdit', label: 'e', description: 'edit', showInFooter: true },
  { keys: ['l'], action: 'mode.worklogAdd.open', label: 'l', description: 'log work', showInFooter: true },
  { keys: ['b'], action: 'mode.depBlocker.open', label: 'b', description: 'add blocker', showInFooter: true },
  { keys: ['d'], action: 'mode.depDependency.open', label: 'd', description: 'add dependency', showInFooter: true },
  { keys: ['?'], action: 'help.toggle', label: '?', description: 'help' },
  { keys: ['ctrl+p'], action: 'mode.palette.open', label: '⌃p', description: 'palette' },
];

const projectDetailBindings: Binding[] = [
  { keys: ['esc', 'q'], action: 'overlay.close', label: 'esc/q', description: 'close', showInFooter: true },
  { keys: ['e'], action: 'entity.openEdit', label: 'e', description: 'edit project', showInFooter: true },
  { keys: ['?'], action: 'help.toggle', label: '?', description: 'help' },
  { keys: ['ctrl+p'], action: 'mode.palette.open', label: '⌃p', description: 'palette' },
];

const inputModeBindings: Binding[] = [
  { keys: ['esc'], action: 'overlay.close', label: 'esc', description: 'cancel', showInFooter: true },
  { keys: ['?'], action: 'help.toggle', label: '?', description: 'help' },
];

const helpBindings: Binding[] = [
  { keys: ['esc', '?', 'q'], action: 'help.toggle', label: 'esc/?/q', description: 'close help', showInFooter: true },
];

export const keymap: Record<KeymapMode, Binding[]> = {
  browse: browseBindings,
  detail: detailBindings,
  projectdetail: projectDetailBindings,
  projectedit: inputModeBindings,
  quickadd: inputModeBindings,
  edit: inputModeBindings,
  search: inputModeBindings,
  palette: inputModeBindings,
  worklogadd: inputModeBindings,
  depadd: inputModeBindings,
  help: helpBindings,
};

/** Bindings that should appear in the command palette (action + nice label, ignoring per-mode duplicates). */
export function paletteActions(): Binding[] {
  const seen = new Map<ActionId, Binding>();
  for (const mode of Object.keys(keymap) as KeymapMode[]) {
    for (const b of keymap[mode]) {
      if (seen.has(b.action)) continue;
      if (b.paletteGlobal || mode === 'browse' || mode === 'detail' || mode === 'projectdetail') {
        seen.set(b.action, b);
      }
    }
  }
  return Array.from(seen.values());
}
