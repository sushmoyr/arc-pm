import { describe, it, expect } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ImportExample, ImportFile } from '../../src/types/importSchema.js';

describe('arc schema (import-file JSON Schema)', () => {
  it('emits a JSON Schema with the expected top-level shape', () => {
    const schema = zodToJsonSchema(ImportFile, {
      name: 'ArcImportFile',
      $refStrategy: 'root',
    }) as Record<string, unknown>;

    expect(schema['$ref']).toBe('#/definitions/ArcImportFile');
    const defs = schema['definitions'] as Record<string, unknown>;
    expect(defs).toBeDefined();
    const root = defs['ArcImportFile'] as {
      type: string;
      properties: Record<string, unknown>;
    };
    expect(root.type).toBe('object');
    expect(Object.keys(root.properties).sort()).toEqual([
      'dependencies',
      'projects',
      'tasks',
    ]);
  });

  it('round-trips: the bundled example validates against the live ImportFile schema', () => {
    const parsed = ImportFile.parse(ImportExample);
    expect(parsed.projects).toHaveLength(1);
    expect(parsed.tasks).toHaveLength(2);
    expect(parsed.dependencies).toEqual([
      { task: 'ARC-2', kind: 'depends_on', target: 'ARC-1' },
    ]);
  });
});
