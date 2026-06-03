// Minimal type shims so the dev-only self-play runner (tournament.test.ts) can
// write its results file under tsc without pulling in @types/node, which can
// clash with React Native's global typings. Real implementations come from the
// Node runtime under Jest.

declare module 'fs' {
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function existsSync(path: string): boolean;
  export function writeFileSync(path: string, data: string): void;
  export function appendFileSync(path: string, data: string): void;
}

declare module 'path' {
  export function join(...parts: string[]): string;
}
