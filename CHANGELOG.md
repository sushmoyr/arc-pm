# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-05-02

### Added
- **Hierarchical Tree View:** Tasks in the TUI are now displayed in a tree structure. Press `v` to expand/collapse parent tasks (Epics/Stories).
- **Task Deletion:** Added `arc delete <id>` command and `x` keybinding in the TUI to remove tasks.
- **Epic Status Automation:** 
  - Epics automatically move to `IN_PROGRESS` when any child task starts.
  - Epics automatically move to `DONE` when all child tasks are completed.
- **Dependency Cycle Detection:** Transitive cycle detection prevents logical loops in task dependencies.
- **Explicit ID Support:** `arc import` and `arc add` now support providing explicit IDs (e.g., `ARC-123`), with automatic project counter adjustment.

### Fixed
- **Dependency Logic:** Fixed `arc next` to correctly account for both `blocks` and `depends_on` relationships.
- **Hierarchical Blocking:** Child tasks are no longer blocked from `arc next` by their parent's status (unless the parent is `DONE`).
- **Cross-Project Dependencies:** Added validation to prevent dependencies between tasks in different projects.
- **TUI Cursor Desync:** Fixed cursor positioning when the task list is filtered or hierarchical.
- **Import ID Preservation:** `arc import` now preserves IDs from the JSON file, maintaining dependency integrity.
- **Missing Imports:** Fixed a TUI compilation error due to missing `visibleTasks` import.

### Changed
- **Ready Task Logic:** `arc next` now excludes `EPIC` type tasks as they are organizational containers.
- **Dependency Querying:** Improved `DependencyRepo` with `listIncoming` for efficient graph traversal.
