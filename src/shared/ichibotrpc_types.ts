import { ParameterType } from "./util";

export const APP_VERSION = 13;

export const ALL_SYM = '*';
export const symFriendlyName = (s: string | null): string => (s === null || s === '*') ? 'global' : s;

export interface GlobalContext {
  currentInstrument: string | null;
}

export interface DebuggableArgs {
  debug?: boolean;
}

export interface AuthArgs {
  auth: {
    apiKey: string;
    apiSecret: string;
    subAccount?: string | null;
  }
}

export interface CommonArgs extends DebuggableArgs, AuthArgs {}

export interface AliasMapping { [aliasName: string]: string }

export interface IchibotRPC {
  hello: (args: {name: string, version: number, initLines: string[]} & CommonArgs) => Promise<{
    instanceStarted: boolean;
    version: number;
  }>;
  poke: (args: {} & CommonArgs) => Promise<{}>;
  bye: (args: {} & CommonArgs) => Promise<{
    ok: boolean;
  }>;
  getCompletions: (args: CommonArgs) => Promise<{
    completions: [string[], string];
  }>,
  rawcmd: (args: {cmd: string} & CommonArgs) => Promise<{
    message?: string;
    success: boolean;
  }>;
}


export interface ContextNotification {
  notification: 'context';
  params: GlobalContext;
}

export interface MessageNotification {
  notification: 'feed';
  params: {
    message: [any, ...any[]];
    type: 'log' | 'error' | 'warn' | 'dir' | 'debug';
  }
}

export type IchibotRPCNotification =
  | MessageNotification
  | ContextNotification
  ;

export interface RPCRequest<T extends keyof IchibotRPC> {
  jsonrpc: '2.0';
  method: T;
  params: ParameterType<IchibotRPC[T]>;
  id?: string | number | null;
}

export interface RPCResponse<T extends keyof IchibotRPC> {
  jsonrpc: '2.0';
  result: ReturnType<IchibotRPC[T]>;
  id?: string | number | null;
}

export interface RPCError {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number | null;
}
