import { useEffect, useState } from 'react';
import { useStdout } from 'ink';

export type Breakpoint = 'narrow' | 'normal' | 'wide';

export interface TerminalSize {
  cols: number;
  rows: number;
  breakpoint: Breakpoint;
}

const NARROW_MAX = 80;
const WIDE_MIN = 120;

function classify(cols: number): Breakpoint {
  if (cols < NARROW_MAX) return 'narrow';
  if (cols >= WIDE_MIN) return 'wide';
  return 'normal';
}

function read(stdout: NodeJS.WriteStream | undefined): TerminalSize {
  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;
  return { cols, rows, breakpoint: classify(cols) };
}

export function useTerminalSize(): TerminalSize {
  const { stdout } = useStdout();
  const [size, setSize] = useState<TerminalSize>(() => read(stdout));

  useEffect(() => {
    if (!stdout) return;
    const onResize = (): void => setSize(read(stdout));
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  return size;
}
