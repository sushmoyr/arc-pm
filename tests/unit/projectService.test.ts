import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database as Db } from 'better-sqlite3';
import { openDatabase, closeDatabase } from '../../src/db/connection.js';
import { ProjectService } from '../../src/services/projectService.js';
import { ValidationError } from '../../src/utils/errors.js';

describe('ProjectService', () => {
  let db: Db;
  let service: ProjectService;

  beforeEach(() => {
    db = openDatabase({ path: ':memory:' });
    service = new ProjectService(db);
  });

  afterEach(() => {
    db.close();
    closeDatabase();
  });

  it('creates a project with defaults', () => {
    const p = service.create({ id: 'ABC', name: 'A B C' });
    expect(p.id).toBe('ABC');
    expect(p.name).toBe('A B C');
    expect(p.description).toBe('');
    expect(p.tech_stack).toBe('');
  });

  it('rejects duplicate ids', () => {
    service.create({ id: 'X1', name: 'one' });
    expect(() => service.create({ id: 'X1', name: 'dup' })).toThrow(ValidationError);
  });

  it('rejects invalid id formats', () => {
    expect(() => service.create({ id: 'lowercase', name: 'no' })).toThrow();
    expect(() => service.create({ id: '1NUM', name: 'no' })).toThrow();
    expect(() => service.create({ id: '', name: 'no' })).toThrow();
  });

  it('updates fields', () => {
    service.create({ id: 'X1', name: 'one' });
    const updated = service.update('X1', { tech_stack: 'TypeScript' });
    expect(updated.tech_stack).toBe('TypeScript');
  });

  it('lists projects sorted by id', () => {
    service.create({ id: 'BBB', name: 'b' });
    service.create({ id: 'AAA', name: 'a' });
    expect(service.list().map((p) => p.id)).toEqual(['AAA', 'BBB']);
  });
});
