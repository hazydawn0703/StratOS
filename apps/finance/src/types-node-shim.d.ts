declare module 'node:child_process' {
  export function execFileSync(file: string, args: string[], options?: { encoding?: string }): string;
}

declare module 'node:fs' {
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, content: string): void;
  export function existsSync(path: string): boolean;
  export function unlinkSync(path: string): void;
}

declare module 'node:path' {
  export function dirname(path: string): string;
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
}

declare module 'node:http' {
  export interface IncomingMessage {
    method?: string;
    url?: string;
    on(event: 'data', listener: (chunk: string) => void): void;
    on(event: 'end', listener: () => void): void;
  }
  export interface ServerResponse {
    statusCode: number;
    setHeader(name: string, value: string): void;
    end(payload?: string): void;
  }
  export interface Server {
    listen(port: number, host?: string): void;
    close(): void;
  }
  export function createServer(handler: (req: IncomingMessage, res: ServerResponse) => void): Server;
}

declare module 'node:url' {
  export class URL {
    constructor(input: string, base?: string);
    pathname: string;
    searchParams: {
      entries(): IterableIterator<[string, string]>;
      get(name: string): string | null;
    };
  }
}

declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
};
