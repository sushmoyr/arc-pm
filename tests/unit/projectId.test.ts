import { describe, it, expect } from 'vitest';
import { deriveProjectId } from '../../src/utils/projectId.js';

const never = () => false;
const taken = (...ids: string[]) => (id: string) => ids.includes(id);

describe('deriveProjectId', () => {
  it('builds an acronym from word initials', () => {
    expect(deriveProjectId('School Management System', never)).toBe('SMS');
    expect(deriveProjectId('arc-pm', never)).toBe('AP');
    expect(deriveProjectId('My Cool Project', never)).toBe('MCP');
  });

  it('handles a single-word directory', () => {
    expect(deriveProjectId('frontend', never)).toBe('F');
  });

  it('skips common stopwords', () => {
    expect(deriveProjectId('Tales of the Forgotten Realm', never)).toBe('TFR');
  });

  it('lowercases and uppercases consistently', () => {
    expect(deriveProjectId('SCHOOL_management_System', never)).toBe('SMS');
  });

  it('extends by cycling word initials starting at index 1 on collision', () => {
    expect(deriveProjectId('School Management System', taken('SMS'))).toBe('SMSM');
    expect(deriveProjectId('School Management System', taken('SMS', 'SMSM'))).toBe('SMSMS');
    expect(
      deriveProjectId('School Management System', taken('SMS', 'SMSM', 'SMSMS')),
    ).toBe('SMSMSS');
  });

  it('extends a single-word project by repeating the initial', () => {
    expect(deriveProjectId('frontend', taken('F'))).toBe('FF');
    expect(deriveProjectId('frontend', taken('F', 'FF'))).toBe('FFF');
  });

  it('falls back to PROJECT when no letter words are present', () => {
    expect(deriveProjectId('123 456', never)).toBe('PROJECT');
    expect(deriveProjectId('123 456', taken('PROJECT'))).toBe('PROJECT2');
    expect(deriveProjectId('', never)).toBe('PROJECT');
  });

  it('drops words that start with non-letters but keeps mixed words', () => {
    expect(deriveProjectId('3D Modeler', never)).toBe('M');
  });

  it('strips non-alphanumeric separators', () => {
    expect(deriveProjectId('foo/bar.baz qux', never)).toBe('FBBQ');
  });
});
