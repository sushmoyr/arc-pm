export type ExitCode = 0 | 1 | 2 | 3;

export class AppError extends Error {
  readonly exitCode: ExitCode;

  constructor(message: string, exitCode: ExitCode = 1) {
    super(message);
    this.name = 'AppError';
    this.exitCode = exitCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 3);
    this.name = 'ValidationError';
  }
}

export function exitWithError(err: unknown): never {
  if (err instanceof AppError) {
    process.stderr.write(`${err.name}: ${err.message}\n`);
    process.exit(err.exitCode);
  }
  if (err instanceof Error) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`Error: ${String(err)}\n`);
  process.exit(1);
}
