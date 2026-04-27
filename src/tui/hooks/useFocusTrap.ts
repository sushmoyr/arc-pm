import { useState, useCallback } from 'react';

/**
 * Tracks which form field index is currently focused. Wraps around at the ends.
 * The actual key handling (tab/shift-tab) lives in the form component since it
 * needs to coordinate with TextInput.
 */
export function useFieldNav(fieldCount: number, initial = 0) {
  const [index, setIndex] = useState(initial);
  const next = useCallback(
    () => setIndex((i) => (i + 1) % fieldCount),
    [fieldCount],
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + fieldCount) % fieldCount),
    [fieldCount],
  );
  const set = useCallback((i: number) => setIndex(i), []);
  return { index, next, prev, set };
}
