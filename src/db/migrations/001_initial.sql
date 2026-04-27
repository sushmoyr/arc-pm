-- ARC initial schema. JIRA-lite: projects, tasks (PROJECT-N ids), dependencies, worklog.

CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tech_stack  TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE project_counters (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  last_id    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id   TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('EPIC','STORY','TASK','BUG')),
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL CHECK (status IN ('BACKLOG','TODO','IN_PROGRESS','REVIEW','DONE')) DEFAULT 'BACKLOG',
  priority    INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_priority ON tasks(priority);

CREATE TABLE task_dependencies (
  task_id   TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  kind      TEXT NOT NULL CHECK (kind IN ('blocks','depends_on')),
  PRIMARY KEY (task_id, target_id, kind)
);

CREATE INDEX idx_deps_target ON task_dependencies(target_id);

CREATE TABLE worklog (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_worklog_task ON worklog(task_id);

CREATE TRIGGER trg_projects_updated_at
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER trg_tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = OLD.id;
END;
