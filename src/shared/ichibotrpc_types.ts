import { ParameterType } from "./util";
import { ExchangeLabel } from './types';

export const APP_VERSION = "19.1";

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
    exchange: ExchangeLabel;
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
    subAccount?: string | null;
    friendlyName: string;
  }
}

export interface ClientArgs {
  clientId?: string;
}

export interface CommonArgs extends DebuggableArgs, AuthArgs, ClientArgs {}

export interface AliasMapping { [aliasName: string]: string }

export interface IchibotRPC {
  hello: (args: {
    name: string, version: number | string, initLines: string[],
  } & CommonArgs) => Promise<{
    instanceStarted: boolean;
    version: number | string;
  }>;
  reloadInit: (args: {initLines: string[]} & CommonArgs) => Promise<{ok: boolean}>,
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

export type InstructionNotification = {
  notification: 'instruction';
  params: {
    instruction: 'force-disconnect';
    reason: string;
  }
}

export type IchibotRPCNotification =
  | MessageNotification
  | ContextNotification
  | InstructionNotification
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
