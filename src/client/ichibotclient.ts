import { IchibotRPC, AuthArgs, MessageNotification, ContextNotification, GlobalContext, ALL_SYM, APP_VERSION, InstructionNotification } from '../shared/ichibotrpc_types';
import WebSocket from 'ws';
import { Cable, Waterfall, exponentialTruncatedBackoff } from "hydrated-ws";
import {
  ParameterType,
  Logger,
  isReplacementDefinition,
  splitMajorMinorVersion,
  exhaustiveCheck,
} from '../shared/util';
import { CONSOLE_COLORS } from './constants';
import { ExchangeLabel } from '../shared/types';
import { IncomingMessage } from 'http';
import { v4 as uuid } from '../uuid';

const CLIENT_VERSION_FULL = APP_VERSION;
const [CLIENT_VERSION_MAJOR, CLIENT_VERSION_MINOR] = splitMajorMinorVersion(CLIENT_VERSION_FULL);

const COL = CONSOLE_COLORS;
const POKE_INTERVAL = 5000;

export interface ClientDB {
  push: (key: string, value: any) => void;
  delete: (key: string) => void;
  filter: <T = any>(root: string, fn: (item: T, key: string | number) => boolean) => T[] | undefined;
}

export interface IchibotClientOpts {
  wsUrlA: string;
  wsUrlB: string;
  wsUrlC: string;
  omitConnectionQueryString?: boolean;
  getDataSafe: <T>(path: string, defaultValue: T) => T;
  logger: Logger;
  readInitFile: (exchange: ExchangeLabel) => {initLines: string[]};
  saveCmdToInit: (exchange: ExchangeLabel, contextSymbol: string, lineMatchers: Array<string | null>, cmd: string | null) => void;
  debug?: boolean;
  clientDB: ClientDB;
  process: {
    exit: ((ret: number) => void) | ((ret: number) => never);
  },
  io: {
    query?: (q: string) => Promise<string>;
    setPrompt: (p: string) => void;
  },
  startWithFriendlyName?: string
}

type HeartbreakerInternals = {
  waterfall: Waterfall;
  pingMs: number;
  msg?: string;
  resetMs: number;
  lastMs: number;
  pingTimer?: NodeJS.Timeout;
  checkTimer?: NodeJS.Timeout;
};

class Heartbreaker {
  private internals: HeartbreakerInternals;
  constructor(waterfall: Waterfall, pingMs: number, resetMs: number, msg?: string) {
    const internals: HeartbreakerInternals = {
      waterfall,
      pingMs,
      msg,
      resetMs,
      lastMs: Date.now(),
      pingTimer: undefined,
      checkTimer: undefined,
    };
    const thisHb = this;
    const ping =
      msg === undefined
        ? () => {
            if (internals.waterfall.readyState !== WebSocket.OPEN) {
              internals.lastMs = Date.now();
            }
          }
        : () => {
            if (internals.waterfall.readyState === WebSocket.OPEN) {
              try {
                internals.waterfall.send(internals.msg!);
              } catch {
              } finally {
                return;
              }
            }
            internals.lastMs = Date.now();
          };
    const check = () => {
      setImmediate(() => {
        if (Date.now() > internals.lastMs + resetMs) {
          thisHb.reset();
        }
      });
    };
    const open = () => {
      internals.pingTimer && clearInterval(internals.pingTimer);
      internals.checkTimer && clearInterval(internals.checkTimer);
      internals.pingTimer = setInterval(ping, pingMs);
      internals.checkTimer = setInterval(check, resetMs);
    };
    internals.waterfall.addEventListener('open', open);
    open();
    this.internals = internals;
  }
  public pong() {
    this.internals.lastMs = Date.now();
  }
  public reset() {
    const { internals } = this;
    internals.waterfall.reset();
    internals.pingTimer && clearInterval(internals.pingTimer);
    internals.checkTimer && clearInterval(internals.checkTimer);
  }
}

const IS_NODEJS = typeof window === 'undefined';

const getAuthSaveKey = (friendlyName: string): string => `/auth-${friendlyName}`;
const getCookieSaveKey = (serverUrl: string, exchangeFriendlyName: string): string => `/cookie_${serverUrl.replace(/[:\/.]/g, '_')}_${exchangeFriendlyName}`;

export default class IchibotClient {
  private ws: (Waterfall & { intendedClose?: boolean }) | null = null;
  private internalWs: WebSocket | null = null;
  private cable: Cable | null = null;
  private auth: AuthArgs['auth'] | null = null;
  private context: GlobalContext | null = null;

  private output: Logger;

  public lastPokeResponse: number = Infinity;

  private isFirstLogin: boolean = true;

  private activeLoginsByFriendlyName: Set<string> = new Set();
  private clientId: string;

  private notifyConnect = true;

  constructor(private opts: IchibotClientOpts)  {
    this.output = opts.logger;

    this.clientId = this.ensureClientId();
    this.startupApplyAuthFromStore(opts.startWithFriendlyName);
  }

  /*
  Generate websocket URL based on exchange
  */
  private generateWsUrl(exchange: ExchangeLabel) {
    return (
      (exchange === 'globe'
        ? this.opts.wsUrlC
        : exchange === 'bybit'
        ? this.opts.wsUrlB
        : this.opts.wsUrlA) +
      (this.opts.omitConnectionQueryString
        ? ''
        : `?primaryexchange=${exchange}`)
    );
  }

  private generateWsHeaders(exchange: ExchangeLabel, exchangeFriendlyName: string) {
    const wsUrl = this.generateWsUrl(exchange);
    const cookieSaveKey = getCookieSaveKey(wsUrl, exchangeFriendlyName);
    const currentCookie = IS_NODEJS
      ? this.opts.clientDB.filter('/', (_item, key) => key === cookieSaveKey.replace('/', ''))?.[0]
      : undefined;
    const wsHeaders: Record<string, string> = {
      'client-ws-library': 'hydrated-ws',
      'X-exchange': exchange,
    };
    if (typeof currentCookie === 'string') {
      wsHeaders.Cookie = currentCookie;
    }
    return wsHeaders;
  }

  private startupApplyAuthFromStore(name?: string): void {
    const potentialAuths =
      this.opts.clientDB.filter(
        '/',
        (_item: AuthArgs['auth'], key) => typeof key === 'string' && key.startsWith('auth')
      ) ?? [];
    const matchingAuth =
      !potentialAuths || potentialAuths.length === 0
        ? null
        : potentialAuths.find(
            (auth: AuthArgs['auth']) => auth.friendlyName === (name || 'default')
          );
    this.auth = matchingAuth ?? potentialAuths[0];
  }

  private applyAuthFromStore(exchange: ExchangeLabel | null, name: string | null): void {
    const potentialAuths = this.opts.clientDB.filter('/', (item: AuthArgs['auth'], key) => typeof key === 'string' && key.startsWith('auth') && (!exchange || item?.exchange === exchange)) ?? [];
    const matchingAuth = (!potentialAuths || potentialAuths.length === 0) ? null : potentialAuths.find((auth: AuthArgs['auth']) => auth.friendlyName === (name || 'default'));
    this.auth = matchingAuth ?? (name ? null : potentialAuths[0]);
  }

  private ensureClientId(): string {
    const CLIENT_ID_KEY = 'client-id';
    let clientId = this.opts.clientDB.filter('/', (_item: string, key) => typeof key === 'string' && key === CLIENT_ID_KEY)?.[0];
    if (!clientId) {
      clientId = uuid();
      this.opts.clientDB.push(`/${CLIENT_ID_KEY}`, clientId);
    }
    return clientId;
  }

  private async close(): Promise<void> {
    if (this.ws !== null) {
      this.ws.intendedClose = true;
      this.cable?.destroy();
      this.cable = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private async connect(farewell = false): Promise<Cable> {
    const ichibotClient = this;
    return new Promise(async (resolve) => {
      if (!this.auth) {
        throw new Error(`Cannot connect: no API keys present`);
      }

      let resolved = false;

      const primaryExchange = this.auth.exchange;
      const friendlyName = this.auth?.friendlyName ?? 'default';

      if (this.ws !== null) {
        this.output.log(`Attempting to close an existing websocket connection before starting a new one.`);
        await this.close();
      }

      const wsUrl = this.generateWsUrl(primaryExchange);
      let hb: Heartbreaker;
      this.ws = new Waterfall(wsUrl, undefined, {
        connectionTimeout: 2000,
        emitClose: true,
        retryPolicy: exponentialTruncatedBackoff(100, 8),
        // @ts-ignore - dispatchEvent not implemented
        factory: (url, protocols) => {
          const ws = new WebSocket(url, protocols, {
            perMessageDeflate: false,
            headers: this.generateWsHeaders(primaryExchange, friendlyName),
          });
          ws.on('upgrade', (res: IncomingMessage) => {
            if (IS_NODEJS && res.headers['set-cookie']) {
              const newCookies = res.headers['set-cookie'].map((s) => s.split(';')[0]).join('; ');
              this.opts.clientDB.push(getCookieSaveKey(ws.url, friendlyName), newCookies);
            }
          });
          ws.on('pong', () => {
            hb.pong();
          });
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.ping(() => {});
            }
          }, POKE_INTERVAL);
          ws.on('close', () => {
            clearInterval(pingInterval);
          });
          ichibotClient.internalWs = ws;
          return ws;
        },
      });
      // @ts-ignore - dispatchEvent is not implemented for ws - https://github.com/websockets/ws/issues/1583
      const cable = new Cable(this.ws);
      hb = new Heartbreaker(this.ws, 5000, 10000);

      this.ws.onerror = (ev) => {
        if (ev.type === 'error') {
          // @ts-ignore
          this.output.debug(`Websocket error: ${ev.message}`);
        }
      };

      this.ws.onopen = () => {
        if (this.notifyConnect) {
          this.output.log(`Connection open to ${this.auth?.friendlyName ?? 'server'}`);
          this.notifyConnect = false;
        }
        if (!farewell) {
          this.login().catch((err) => {
            this.output.error(`Failed to login:`, err.message);
          });
        }
        if (!resolved) {
          resolved = true;
          resolve(cable);
        }
      };

      this.ws.onclose = () => {
        if (this.ws?.intendedClose) {
          this.output.log(`Connection closed.`);
          return;
        }
        if (!resolved) {
          resolved = true;
          resolve(cable); // accept input at prompt
        }
      };

      cable.register('IchibotRPCNotification', async (data) => {
        const { notification, params } = data;
        switch (notification) {
          case 'feed':
            let feed: MessageNotification['params'] = params;
            if (feed.type === 'dir') {
              this.output.dir(feed.message[0]);
            } else if (feed.type === 'debug') {
              if (this.opts.debug) {
                this.output.debug(...feed.message);
              }
            } else {
              this.output[feed.type](...feed.message);
            }
            break;
          case 'context':
            let context: ContextNotification['params'] = params;
            this.context = context;
            this.refreshPrompt();
            break;
          case 'instruction':
            let inst: InstructionNotification['params'] = params;
            if (inst.instruction === 'force-disconnect') {
              this.output.warn(
                `The server has terminated your session. You may connect again in this client by restarting or typing "login <name of your key>".`
              );
              this.close();
            } else {
              exhaustiveCheck(inst.instruction);
            }
        }
      });

      this.cable = cable;

      this.output.log(`Initializing...`);

      this.refreshPrompt();
    });
  }

  private logError = (err: Error & {code?: number}) => {
    if (err.code === 401) {
      this.output.error(`Not logged in. Your API key may not be correct.`)
    } else {
      this.output.error(`Error from the server: ${err.message}`);
    }
  }

  private callRpc<T extends keyof IchibotRPC>(method: T, arg: Omit<ParameterType<IchibotRPC[T]>, 'auth'>): ReturnType<IchibotRPC[T]> {
    if (this.ws?.readyState !== WebSocket.OPEN || this.internalWs?.readyState !== WebSocket.OPEN) {
      this.notifyConnect = true;
      throw new Error(`Could not send a request to Ichibot server: client is not connected.`);
    }
    return this.cable!.request(method, {
      auth: this.auth,
      ...arg,
      context: this.context,
      clientId: this.clientId,
    }) as ReturnType<IchibotRPC[T]>;
  }

  private getPromptText() {
    if (!this.context) {
      return '[not ready] ';
    }
    return this.context.currentInstrument
      ? `[${this.context.currentInstrument}] > `
      : `[global *] > `;
  }

  private refreshPrompt() {
    this.opts.io.setPrompt(this.getPromptText());
  }

  private isInLoginProcess: boolean = false;

  public async start() {
    this.refreshPrompt();

    if (!this.auth) {
      this.output.log(`It seems you have not inserted your API key yet. Please type 'login' to start.`);
    } else {
      await this.connect();
    }

    const done = false;

    while (!done) {
      try {

        const answer = (await this.query(this.getPromptText())).trim();

        this.output.log(COL.Dim, ':::', answer);
        if (answer.length > 0) {
          const result = this.processCommand(answer)
            .then((res) => {
              if (res && !res.success) {
                throw new Error(res.message || `Unspecified error processing ${answer}`);
              }
            })
            .catch((err) => {
              this.output.error(`Error processing the command:`, err.message);
            });

          result.then(() => this.output.debug(`Command ${answer.split(' ')[0]} completed.`));

          if (answer.startsWith('login')) {
            // Login is special using query to get answers. Can't start getting new queries in this loop before it's done.
            await result;
          }
        }
      } catch (err) {
        this.output.error(`Unexpected error: ${err.message}`);
      }
    }
  }

  queryAnswersBuffer: string[] = [];
  queryResolvesBuffer: Array<(r: string) => void> = [];

  private query(q: string): Promise<string> {
    if (this.opts.io.query) {
      return this.opts.io.query(q);
    } else {
      if (this.queryAnswersBuffer.length > 0) {
        const answer = this.queryAnswersBuffer.shift();
        if (answer === undefined) {
          return Promise.reject(new Error(`Should not have happened, answer undefined`));
        }
        return Promise.resolve(answer);
      } else {
        this.opts.io.setPrompt(q);
        return new Promise((resolve) => {
          this.queryResolvesBuffer.push(resolve);
        })
      }
    }
  }

  public sendInput(msg: string) {
    if (this.queryResolvesBuffer.length > 0) {
      const resolve = this.queryResolvesBuffer.shift();
      if (resolve === undefined) {
        throw new Error(`Should not have happened, resolve undefined`);
      }
      resolve(msg);
    } else {
      this.queryAnswersBuffer.push(msg);
    }
  }

  private reloadInit(): Promise<unknown> {
    if (!this.auth) {
      this.output.log(`Not authenticated, cannot reload init script`);
      return Promise.reject();
    }

    this.output.log(`Reloading init script from file`);
    const { initLines } = this.opts.readInitFile(this.auth.exchange);

    return this.callRpc('reloadInit', { initLines, ...this.auth })
  }

  public async login(force = false) {
    if (this.isInLoginProcess && !force) return; 
    return await this._login();
  }

  public async _login() {
    if (!this.auth) {
      return;
    }

    if (!this.ws) {
      await this.connect();
    }

    const { initLines } = this.opts.readInitFile(this.auth.exchange);

    const result = await this.callRpc('hello', {name: 'donut', version: CLIENT_VERSION_FULL, initLines});
    this.activeLoginsByFriendlyName.add(this.auth.friendlyName);

    const [serverMajor, serverMinor] = splitMajorMinorVersion(result.version);

    if (serverMajor > CLIENT_VERSION_MAJOR || serverMajor === CLIENT_VERSION_MAJOR && serverMinor > CLIENT_VERSION_MINOR) {
      this.output.warn(``);
      this.output.warn(`The server reports a higher app version than this client. This will probably not work for you until you upgrade your client version, but you can try.`);
      this.output.warn(``);
    }

    if (this.isFirstLogin && !result.instanceStarted) {
      this.output.log(`Resumed an existing bot session. Initlines were not re-evaluated.`);
    }

    this.output.debug(`Login steps done.`);
    this.isFirstLogin = false;
    return;
  }

  public async logout() {
    this.output.log(`Signing out...`);
    const auth = this.auth;
    await this.callRpc('bye', {});
    await this.close();
    this.output.log(`Clearing your credentials for ${this.auth?.friendlyName ?? 'the current connection'}...`)
    this.activeLoginsByFriendlyName.delete(auth?.friendlyName ?? 'default');
    this.opts.clientDB.delete(getAuthSaveKey(auth?.friendlyName ?? 'default'));
    const wsUrl = (auth?.exchange && this.generateWsUrl(auth.exchange)) || '';
    this.opts.clientDB.delete(getCookieSaveKey(wsUrl, auth?.friendlyName ?? 'default'));
    this.auth = null;
    this.output.log('Done.');
  }

  public async handleQuit() {
    while (this.activeLoginsByFriendlyName.size > 0) {
      let cable: Cable | null = null;
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.applyAuthFromStore(
          null,
          Array.from(this.activeLoginsByFriendlyName.values())[0] ?? null
        );
        cable = await this.connect(true);
      } else {
        cable = this.cable;
      }
      const exchange = this.auth?.exchange;
      const friendlyName = this.auth?.friendlyName ?? 'default';
      const wsUrl = this.generateWsUrl(exchange!);
      this.output.log(`Signing out from ${friendlyName}...`);
      cable?.notify('bye', { auth: this.auth });
      this.activeLoginsByFriendlyName.delete(friendlyName ?? 'default');
      await this.close();
      this.opts.clientDB.delete(getCookieSaveKey(wsUrl ?? '', friendlyName ?? 'default'));
    }
    this.opts.process.exit(0);
  }

  async processCommand(cmd: string): Promise<{success: boolean, message?: string, data?: any}> {
    const [a, b, ...rest] = cmd.split(/\s+/).map((p) => p.trim());

    // Comment
    if (a.startsWith('#')) {
      return { success: true };
    }

    if (['exit', 'quit', 'q'].includes(a)) {
      await this.handleQuit();
      return { success: true };
    }

    if (a === 'login') {
      let success: boolean;
      try {
        this.isInLoginProcess = true;

        if (this.ws !== null) {
          this.output.log('Closing existing connection...');
          this.cable?.notify('bye', { auth: this.auth });
          this.activeLoginsByFriendlyName.delete(this.auth?.friendlyName ?? 'default');
          await this.close();
        }

        if (b) {
          this.applyAuthFromStore(null, b);
          if (!this.auth) {
            this.output.error(`Could not find saved key with name "${b}"`);
            return { success: false };
          }
        } else {
          const requestUntilValid = async (msg: string, validator: (s: string) => boolean): Promise<string> => {
            let answer: string;
            do {
              answer = (await this.query(msg)).trim();
            } while (!validator(answer))
            return answer;
          }

          const exchangeLabelAnswer = (
            await requestUntilValid(
              'Exchange: (b)inance futs, binance (s)pot, b(y)bit, (f)tx, (g)lobeDX: ',
              (s) => ['b', 's', 'y', 'f', 'g'].includes(s[0].toLowerCase()))).substring(0,1).toLowerCase();

          const exchangeLabelAnswerMap: { [k: string]: ExchangeLabel } = {
            b: 'binance',
            s: 'binance-spot',
            y: 'bybit',
            f: 'ftx',
            g: 'globe'
          };

          const exchange: ExchangeLabel = exchangeLabelAnswerMap[exchangeLabelAnswer];

          const apiKey = (await requestUntilValid('Your API key: ', (s) => !!s));
          const apiSecret = (await requestUntilValid('Your API secret: ', (s) => !!s));
          const subAccount = exchange === 'ftx' ? (await requestUntilValid('Your FTX subaccount name (leave empty for none): ', () => true)) : '';
          const passphrase =
            exchange === 'globe'
              ? await requestUntilValid('Your API passphrase: ', (s) => !!s)
              : '';
          const friendlyName = (await requestUntilValid('Name these credentials (empty = "default"): ', () => true)) || 'default';

          this.auth = { apiKey, apiSecret, passphrase, subAccount, exchange, friendlyName };
          this.opts.clientDB.push(getAuthSaveKey(friendlyName), this.auth);
          this.output.log('API key saved. To clear current credentials please type "logout".')
        }

        await this.login(true).catch((err) => {
          this.output.error(`Login failed:`, err.message);
        });

        success = true;
      } catch (err) {
        success = false;
      } finally {
        this.isInLoginProcess = false;
      }
      return { success }
    } else {
      if (!this.auth) {
        this.output.log(`It seems you have not inserted your API key yet. Please type 'login' to start.`);
        return { success: true };
      }
    }

    if (
      (this.ws?.readyState !== WebSocket.OPEN || this.internalWs?.readyState !== WebSocket.OPEN) &&
      !this.isInLoginProcess
    ) {
      this.output.log(`Lost connection to server, please wait until reconnected.`);
      this.notifyConnect = true;
      return { success: false, message: 'Not connected.' };
    }

    const auth = this.auth;
    if (!auth) {
      throw new Error(`No auth present. This should not have happened.`);
    }

    if (a === 'logout') {
      await this.logout().catch(this.logError);
      return { success: true };
    }

    if (!this.context) {
      this.output.warn(`Not ready. Cannot execute command yet.`);
      return { success: true };
    }

    if (a === 'reload' && b === 'init') {
      await this.reloadInit();
      return { success: true };
    }

    const currentInstrument = this.context.currentInstrument;

    return this.callRpc('rawcmd', {cmd: cmd, debug: this.opts.debug}).then((result) => {
      if (result.success) {
        if (a === 'alias' && rest.length > 0) {
          this.opts.saveCmdToInit(auth.exchange, currentInstrument ?? ALL_SYM, [a, b, null], cmd);
        } else if (isReplacementDefinition(cmd)) {
          this.opts.saveCmdToInit(auth.exchange, currentInstrument ?? ALL_SYM, [a, b.replace(':', '')], cmd);
        } else if (a === 'fatfinger' && b && currentInstrument !== null) {
          this.opts.saveCmdToInit(auth.exchange, currentInstrument, [a], cmd);
        } else if (a === 'set' && /^[a-zA-Z0-9]+$/.test(b) && rest.length === 1) {
          this.opts.saveCmdToInit(auth.exchange, currentInstrument ?? ALL_SYM, [a, b], cmd);
        } else if (a === 'unalias' && rest.length === 0) {
          this.opts.saveCmdToInit(auth.exchange, currentInstrument ?? ALL_SYM, ['alias', b, null], null);
        } else if (a === 'unreplace' && rest.length === 0) {
          this.opts.saveCmdToInit(auth.exchange, currentInstrument ?? ALL_SYM, ['replace', b, null], null);
        }
        if (result.message) {
          this.output.log(result.message);
        }
      }
      return result;
    });
  }
}
