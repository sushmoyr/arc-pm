import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Project } from '../../src/types/domain.js';
import { bootstrap } from '../../src/integrations/index.js';
import { interpolate } from '../../src/integrations/templates.js';

function makeProject(id = 'TST'): Project {
  return {
    id,
    name: id,
    description: '',
    tech_stack: '',
    created_at: '2026-04-27 00:00:00',
    updated_at: '2026-04-27 00:00:00',
  };
}

describe('interpolate', () => {
  it('substitutes {{var}} placeholders', () => {
    expect(interpolate('id is {{projectId}}', { projectId: 'SMS' })).toBe('id is SMS');
  });

  it('tolerates whitespace inside braces', () => {
    expect(interpolate('id={{ projectId }}', { projectId: 'SMS' })).toBe('id=SMS');
  });

  it('throws on unknown variables', () => {
    expect(() => interpolate('{{unknown}}', { projectId: 'X' })).toThrow(/unknown/);
  });
});

describe('AI integration bootstrap', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'arc-init-'));
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('claude: writes skill + 4 commands', () => {
    const result = bootstrap('claude', { project: makeProject(), cwd, force: false });
    expect(result.provider).toBe('claude');
    expect(result.filesWritten).toHaveLength(5);
    expect(existsSync(join(cwd, '.claude/skills/arc-pm/SKILL.md'))).toBe(true);
    expect(existsSync(join(cwd, '.claude/commands/arc-pickup.md'))).toBe(true);
    expect(existsSync(join(cwd, '.claude/commands/arc-finish.md'))).toBe(true);
    expect(existsSync(join(cwd, '.claude/commands/arc-status.md'))).toBe(true);
    expect(existsSync(join(cwd, '.claude/commands/arc-add.md'))).toBe(true);
  });

  it('claude: skill references the project id', () => {
    bootstrap('claude', { project: makeProject('FOO'), cwd, force: false });
    const skill = readFileSync(join(cwd, '.claude/skills/arc-pm/SKILL.md'), 'utf8');
    expect(skill).toContain('FOO');
    expect(skill).toMatch(/FOO-N/);
  });

  it('codex: writes AGENTS.md', () => {
    const result = bootstrap('codex', { project: makeProject(), cwd, force: false });
    expect(result.filesWritten).toEqual([join(cwd, 'AGENTS.md')]);
    const md = readFileSync(join(cwd, 'AGENTS.md'), 'utf8');
    expect(md).toContain('arc next --json');
  });

  it('gemini: writes GEMINI.md', () => {
    const result = bootstrap('gemini', { project: makeProject(), cwd, force: false });
    expect(result.filesWritten).toEqual([join(cwd, 'GEMINI.md')]);
    const md = readFileSync(join(cwd, 'GEMINI.md'), 'utf8');
    expect(md).toContain('arc next');
  });

  it('does not overwrite existing files unless force=true', () => {
    const target = join(cwd, 'AGENTS.md');
    writeFileSync(target, 'pre-existing\n', 'utf8');
    const skipped = bootstrap('codex', { project: makeProject(), cwd, force: false });
    expect(skipped.filesWritten).toEqual([]);
    expect(skipped.filesSkipped).toEqual([target]);
    expect(readFileSync(target, 'utf8')).toBe('pre-existing\n');

    const forced = bootstrap('codex', { project: makeProject(), cwd, force: true });
    expect(forced.filesWritten).toEqual([target]);
    expect(readFileSync(target, 'utf8')).toContain('arc next --json');
  });
});
