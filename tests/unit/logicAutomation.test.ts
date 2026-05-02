import { describe, it, expect, beforeEach } from 'vitest';
import { openDatabase } from '../../src/db/connection.js';
import { TaskService } from '../../src/services/taskService.js';
import { ProjectService } from '../../src/services/projectService.js';
import type { Database } from 'better-sqlite3';

describe('TaskService Logic (Epic Automation & Cycles)', () => {
  let db: Database;
  let taskService: TaskService;
  let projectService: ProjectService;

  beforeEach(() => {
    db = openDatabase({ path: ':memory:' });
    taskService = new TaskService(db);
    projectService = new ProjectService(db);
    projectService.create({ id: 'TEST', name: 'Test Project' });
  });

  describe('Epic Status Automation', () => {
    it('should transition Epic to IN_PROGRESS when a child task is started', () => {
      const epic = taskService.create({ project_id: 'TEST', title: 'Epic 1', type: 'EPIC', status: 'TODO' });
      const task = taskService.create({ project_id: 'TEST', title: 'Task 1', parent_id: epic.id, status: 'TODO' });

      taskService.updateStatus(task.id, 'IN_PROGRESS');

      const updatedEpic = taskService.get(epic.id);
      expect(updatedEpic.status).toBe('IN_PROGRESS');
    });

    it('should transition Epic to DONE when all child tasks are DONE', () => {
      const epic = taskService.create({ project_id: 'TEST', title: 'Epic 1', type: 'EPIC', status: 'TODO' });
      const t1 = taskService.create({ project_id: 'TEST', title: 'T1', parent_id: epic.id, status: 'TODO' });
      const t2 = taskService.create({ project_id: 'TEST', title: 'T2', parent_id: epic.id, status: 'TODO' });

      taskService.updateStatus(t1.id, 'DONE');
      expect(taskService.get(epic.id).status).toBe('IN_PROGRESS');

      taskService.updateStatus(t2.id, 'DONE');
      expect(taskService.get(epic.id).status).toBe('DONE');
    });

    it('should work recursively for nested hierarchy', () => {
      const epic = taskService.create({ project_id: 'TEST', title: 'Epic', type: 'EPIC' });
      const story = taskService.create({ project_id: 'TEST', title: 'Story', type: 'STORY', parent_id: epic.id });
      const task = taskService.create({ project_id: 'TEST', title: 'Task', parent_id: story.id });

      taskService.updateStatus(task.id, 'DONE');
      expect(taskService.get(story.id).status).toBe('DONE');
      expect(taskService.get(epic.id).status).toBe('DONE');
    });
  });

  describe('Dependency Cycle Detection', () => {
    it('should prevent self-dependency', () => {
      const t1 = taskService.create({ project_id: 'TEST', title: 'T1' });
      expect(() => taskService.addDependency(t1.id, t1.id, 'depends_on')).toThrow('cannot depend on itself');
    });

    it('should prevent direct cycles (A -> B -> A)', () => {
      const t1 = taskService.create({ project_id: 'TEST', title: 'T1' });
      const t2 = taskService.create({ project_id: 'TEST', title: 'T2' });

      taskService.addDependency(t1.id, t2.id, 'depends_on');
      expect(() => taskService.addDependency(t2.id, t1.id, 'depends_on')).toThrow('cycle detected');
    });

    it('should prevent transitive cycles (A -> B -> C -> A)', () => {
      const a = taskService.create({ project_id: 'TEST', title: 'A' });
      const b = taskService.create({ project_id: 'TEST', title: 'B' });
      const c = taskService.create({ project_id: 'TEST', title: 'C' });

      taskService.addDependency(a.id, b.id, 'depends_on');
      taskService.addDependency(b.id, c.id, 'depends_on');
      expect(() => taskService.addDependency(c.id, a.id, 'depends_on')).toThrow('cycle detected');
    });

    it('should handle blocks correctly in cycle detection', () => {
      const a = taskService.create({ project_id: 'TEST', title: 'A' });
      const b = taskService.create({ project_id: 'TEST', title: 'B' });

      taskService.addDependency(a.id, b.id, 'blocks'); // B depends on A
      expect(() => taskService.addDependency(a.id, b.id, 'depends_on')).toThrow('cycle detected');
    });
  });

  describe('Ready Tasks (arc next)', () => {
    it('should not block child tasks if parent Epic is not DONE', () => {
      const epic = taskService.create({ project_id: 'TEST', title: 'Epic', type: 'EPIC' });
      const task = taskService.create({ project_id: 'TEST', title: 'Task', parent_id: epic.id, status: 'TODO' });

      const ready = taskService.next({ project_id: 'TEST' });
      expect(ready.map(t => t.id)).toContain(task.id);
    });

    it('should exclude Epics from ready tasks', () => {
      taskService.create({ project_id: 'TEST', title: 'Epic', type: 'EPIC', status: 'TODO' });
      const ready = taskService.next({ project_id: 'TEST' });
      expect(ready.length).toBe(0);
    });

    it('should respect dependencies', () => {
      const t1 = taskService.create({ project_id: 'TEST', title: 'T1' });
      const t2 = taskService.create({ project_id: 'TEST', title: 'T2' });
      taskService.addDependency(t2.id, t1.id, 'depends_on');

      const ready = taskService.next({ project_id: 'TEST' });
      expect(ready.map(t => t.id)).toContain(t1.id);
      expect(ready.map(t => t.id)).not.toContain(t2.id);
    });
  });
});
