const isObject = (value: unknown) => value !== null && typeof value === 'object';
const isArray = (value: unknown): value is any[] => Array.isArray(value);

export function dropUndef(o: {[key: string]: any}): {[key: string]: any} {
  const res: {[key: string]: any} = {}
  for (const k of Object.keys(o)) {
    if (o[k] !== undefined) {
      res[k] = o[k];
    }
  }
  return res;
}

export function notNull<T>(x: T | null): x is T {
  return x !== null;
}

export function requireNotUndefined<T>(x: T | undefined, msg?: string): T {
  if (x === undefined) {
    throw new Error(msg ?? 'Value is not defined');
  }

  return x;
}

export function exhaustiveCheck(x: never, msg?: string): never {
  throw new Error(msg || `Unexpected type value ${x}`);
}

export function waitUntil(fn: (() => boolean), interval: number = 10) {
  return new Promise((resolve) => {
    if (fn()) {
      return resolve();
    }
    const i = setInterval(() => {
      if (fn()) {
        clearInterval(i);
        resolve();
      }
    }, interval);
  });
}

export class DefaultMap<K, T> extends Map<K, T> {
  constructor(private builder: (() => T), ...args: any[]) {
    super(...args);
  }

  get(key: K): T {
    const existing = super.get(key);
    if (existing) {
      return existing;
    } else {
      const item = this.builder();
      this.set(key, item);
      return item;
    }
  }
}

export const logMethod = (_target: Object, propertyKey: string, desc: PropertyDescriptor) => {
  const fn = desc.value;

  desc.value = function (...args: any[]) {
    console.log(`${propertyKey} called with ${args.map((x) => JSON.stringify(x))}`);
    const result = fn(...args);
    console.log(`${propertyKey} result ${JSON.stringify(result)}`);
    return result;
  }
}

export class RateLimit {
  private currentUtilization: number = 0;
  private resolveQueue: Array<(() => void)> = [];
  private interval: NodeJS.Timeout | null = null;

  constructor(private maxCount: number, private timeout: number) {
  }

  public guard(): Promise<void> {
    if (this.interval === null) {
      this.interval = setInterval(() => {
        const nextBatch = this.resolveQueue.splice(0, this.maxCount);
        this.currentUtilization = nextBatch.length;
        for (const resolve of nextBatch) {
          resolve();
        }

        if (nextBatch.length === 0 && this.interval !== null) {
          clearInterval(this.interval);
          this.interval = null;
        }
      }, this.timeout);
    }

    if (this.currentUtilization < this.maxCount) {
      this.currentUtilization++;
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this.resolveQueue.push(resolve);
      });
    }
  }
}

export type ParameterType<T> = T extends (arg: infer R) => any ? R : never;
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

export interface Logger {
  log: (...args: any[]) => void;
  dir: (arg: {[k: string]: any}) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export const consoleLogger: Logger = {
  log: console.log,
  dir: console.dir,
  warn: console.warn,
  error: console.error,
  debug: (...args: any[]) => {
    if (process.env.DEBUG) {
      console.debug(...args);
    }
  }
}

export const mapToObject = <T>(m: Map<string, T>): {[key: string]: T} => {
  return Object.fromEntries(m.entries());
}

export const objectToMap = <T>(m: {[key: string]: T}): Map<string, T> => {
  return new Map(Object.entries(m));
}

export function throttledWhilePending<T, U>(fn: (p: T) => Promise<U>): (p: T) => Promise<{ wasProcessed: boolean }> {
  let nextCandidate: null | [T, Function] = null;
  let current: null | Promise<any> = null;

  return async function throttledWhilePendingFunction(p: T): Promise<{wasProcessed: boolean}> {
    return new Promise(async (resolve) => {
      if (current) {
        if (nextCandidate) {
          nextCandidate[1]({wasProcessed: false});
        }
        nextCandidate = [p, resolve];
        return;
      }

      nextCandidate = [p, resolve];

      while (nextCandidate) {
        const next = nextCandidate;
        nextCandidate = null;
        current = fn(next[0]).then(() => next[1]({wasProcessed: true}));
        await current
        current = null;
      }
    })
  }
}

// Throttling only applied for calls where the first param matches between calls
export function throttledWhilePendingByFirstParam<T, U>(fn: (p: T) => Promise<U>): (p: T) => Promise<{ wasProcessed: boolean }> {
  let fnMap: Array<{ param: T, nextCandidate: null | [T, Function], current: null | Promise<any> }> = [];

  return async function throttledWhilePendingFunction(p: T): Promise<{wasProcessed: boolean}> {
    if (fnMap.length > 100) {
      fnMap = fnMap.slice(0, 100); // Just to ensure long running processes don't grow forever
    }
    const matchIdx = fnMap.findIndex((m) => m.param === p);
    let match = fnMap[matchIdx];
    if (!match) {
      match = {param: p, nextCandidate: null, current: null};
      fnMap.unshift(match);
    } else {
      // Rearrange so actively used fns are found fast
      const tmp = fnMap[0];
      fnMap[0] = match;
      fnMap[matchIdx] = tmp;
    }

    const m = match;

    return new Promise(async (resolve) => {
      if (m.current) {
        if (m.nextCandidate) {
          m.nextCandidate[1]({wasProcessed: false});
        }
        m.nextCandidate = [p, resolve];
        return;
      }

      m.nextCandidate = [p, resolve];

      while (m.nextCandidate) {
        const next = m.nextCandidate;
        m.nextCandidate = null;
        m.current = fn(next[0]).then(() => next[1]({wasProcessed: true}));
        await m.current
        m.current = null;
      }
    })
  }
}

export type RequireOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?:
    Required<Pick<T, K>>
    & Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys];

export type Optional<T extends {[key: string]: any}> = {[K in keyof T]?: T[K]};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export const stringify = (a: any, depth: number = 3): string => {
  if (depth === 0) {
    return `[a]`;
  } else if (isArray(a)) {
    const inner = a.map((ax) => stringify(ax, depth - 1)).join(', ');
    return `[${inner}]`
  } else if (isObject(a)) {
    const inner = Object.entries(a).map(([k, v]) => k + ': ' + stringify(v, depth - 1)).join(', ');
    return `{${inner}}`;
  } else if (typeof a === 'string') {
    return a;
  } else {
    return JSON.stringify(a);
  }
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const setTerminatingInterval = (fn: (() => boolean), interval: number, opts: {leading?: boolean, onError?: (err: Error) => boolean} = {}) => {
  let instance: NodeJS.Timeout | null = null;

  const handler = () => {
    try {
      const shouldTerminate = fn();
      if (shouldTerminate && instance) {
        clearInterval(instance);
        instance = null;
      }
    } catch (err) {
      if (opts.onError) {
        const shouldTerminate = opts.onError(err);
        if (shouldTerminate && instance) {
          clearInterval(instance);
          instance = null;
        }
      }
    }
  }

  instance = setInterval(handler, interval);;

  if (opts.leading) {
    handler();
  }
}

type SubHandler<T> = (a: T) => void;

export const subscribe = <T, E extends string>(o: {on: (e: E, fn: SubHandler<T>) => void, off: (e: E, fn: SubHandler<T>) => void}, e: E, fn: (a: T) => boolean) => {
  const handler = (a: T) => {
    const shouldTerminate = fn(a);
    if (shouldTerminate) {
      o.off(e, handler);
    }
  };

  o.on(e, handler);

  return {
    unsubscribe: () => {
      o.off(e, handler);
    }
  }
}
