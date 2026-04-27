export interface RenderOptions {
  json?: boolean;
}

export function renderJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function renderText(text: string): void {
  process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
}

export function render(value: unknown, opts: RenderOptions, prettyPrinter: () => string): void {
  if (opts.json) {
    renderJson(value);
  } else {
    renderText(prettyPrinter());
  }
}
