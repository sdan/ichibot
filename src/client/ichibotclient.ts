import { IchibotRPC, AuthArgs, MessageNotification, ContextNotification, GlobalContext, ALL_SYM, APP_VERSION } from '../shared/ichibotrpc_types';
import * as RPC from 'rpc-websockets';
import { ParameterType, Logger, isReplacementDefinition, splitMajorMinorVersion, waitUntil } from '../shared/util';
import { CONSOLE_COLORS } from './constants';
import { ExchangeLabel } from '../shared/types';
import { IncomingMessage } from 'http';

const CLIENT_VERSION_FULL = APP_VERSION;
const [CLIENT_VERSION_MAJOR, CLIENT_VERSION_MINOR] = splitMajorMinorVersion(CLIENT_VERSION_FULL);

const COL = CONSOLE_COLORS;

export interface ClientDB {
  push: (key: string, value: any) => void;
  delete: (key: string) => void;
  filter: <T = any>(root: string, fn: (item: T, key: string | number) => boolean) => T[] | undefined;
}

export interface IchibotClientOpts {
  wsUrl: string;
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
  }
}

const IS_NODEJS = typeof window === 'undefined';

const getAuthSaveKey = (friendlyName: string): string => `/auth-${friendlyName}`;
const getCookieSaveKey = (serverUrl: string, exchangeFriendlyName: string): string => `/cookie_${serverUrl.replace(/[:\/.]/g, '_')}_${exchangeFriendlyName}`;

export default class IchibotClient {
  private rpc: (RPC.Client & { intendedClose?: boolean }) | null = null;
  private auth: AuthArgs['auth'] | null = null;
  private context: GlobalContext | null = null;

  private output: Logger;

  public lastPokeResponse: number = Infinity;

  private isFirstLogin: boolean = true;

  private activeLoginsByFriendlyName: Set<string> = new Set();

  // Sort of a hack to allow updating the Cookie header dynamically in case there's a reconnection so we can apply the newest one, because the RPC lib doesn't allow us a direct route to apply new headers per each reconnection
  private readonly wsHeaders: Record<string, string> = {};

  constructor(private opts: IchibotClientOpts)  {
    this.output = opts.logger;

    this.applyAuthFromStore(null, null);
  }

  private applyAuthFromStore(exchange: ExchangeLabel | null, name: string | null): void {
    const currentCookie = IS_NODEJS ? this.opts.clientDB.filter('/', (_item, key) => key === getCookieSaveKey(this.opts.wsUrl, name ?? 'default').replace('/', ''))?.[0] : undefined;

    if (typeof currentCookie === 'string') {
      this.wsHeaders.Cookie = currentCookie;
    }

    const potentialAuths = this.opts.clientDB.filter('/', (item: AuthArgs['auth'], key) => typeof key === 'string' && key.startsWith('auth') && (!exchange || item?.exchange === exchange)) ?? [];
    const matchingAuth = (!potentialAuths || potentialAuths.length === 0) ? null : potentialAuths.find((auth: AuthArgs['auth']) => auth.friendlyName === (name || 'default'));
    this.auth = matchingAuth ?? (name ? null : potentialAuths[0]);
  }

  private notifyReconnect = false;

  private async close(): Promise<void> {
    if (this.rpc !== null) {
      this.rpc.intendedClose = true;
      this.rpc.close();
      await waitUntil(() => !this.isConnected, 100);
      this.rpc = null;
    }
  }

  private async connect(): Promise<void> {
    return new Promise(async (resolve) => {
      if (!this.auth) {
        throw new Error(`Cannot connect: no API keys present`);
      }

      const primaryExchange = this.auth.exchange ?? 'ftx';

      if (this.rpc !== null) {
        this.close();
      }

      this.wsHeaders['X-exchange'] = primaryExchange;
      const rpc: (RPC.Client & { intendedClose?: boolean }) = this.rpc = new RPC.Client(this.opts.wsUrl + (this.opts.omitConnectionQueryString ? '' : `?primaryexchange=${primaryExchange}`), {
        autoconnect: false,
        reconnect: true,
        max_reconnects: 99999,
        headers: this.wsHeaders,
      });

      let dcTimeout: NodeJS.Timeout | null = null;
      rpc.connect();
      rpc.on('upgrade', (res: IncomingMessage) => {
        if (IS_NODEJS && res.headers['set-cookie']) {
          const newCookies = res.headers['set-cookie'].map((s) => s.split(';')[0]).join('; ');
          this.wsHeaders.Cookie = newCookies;
          this.opts.clientDB.push(getCookieSaveKey(this.opts.wsUrl, this.auth?.friendlyName ?? 'default'), newCookies);
        }
      });
      rpc.on('error', () => {
        if (dcTimeout === null) {
          this.output.error('Connection error to the server. Trying to reconnect...');
        }
      });
      rpc.on('open', () => {
        this.isConnected = true;
        if (dcTimeout !== null) {
          if (this.notifyReconnect) {
            this.output.log('Reconnected');
          }
          clearTimeout(dcTimeout);
        } else {
          this.output.log(`Connection open to ${this.auth?.friendlyName ?? 'server'}`);
        }
        this.notifyReconnect = false;
        this.login().catch((err) => {
          this.output.error(`Failed to login:`, err.message);
        });
      });
      rpc.on('close', () => {
        this.isConnected = false;
        if (rpc.intendedClose) {
          clearInterval(pokeInterval);
          return;
        }
        dcTimeout = setTimeout(() => {
          this.output.log('Connection closed, trying to reconnect...');
        }, 10000)
      });
      rpc.on('feed', (msg: MessageNotification['params']) => {
        if (msg.type === 'dir') {
          this.output.dir(msg.message[0]);
        } else if (msg.type === 'debug') {
          if (this.opts.debug) {
            this.output.debug(...msg.message);
          }
        } else {
          this.output[msg.type](...msg.message);
        }
      })
      rpc.on('context', (msg: ContextNotification['params']) => {
        this.context = msg;
        this.refreshPrompt();
      })

      this.output.log(`Initializing...`);

      const POKE_INTERVAL = 5000;
      const pokeInterval = setInterval(() => {
        if (!this.isConnected) {
          return;
        }
        this.callRpc('poke', {})
          .then(() => {
            this.lastPokeResponse = Date.now();
          })
          .catch(this.logError);
      }, POKE_INTERVAL);

      rpc.once('open', () => {
        resolve();
      });

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
    if (!this.rpc) { throw new Error(`Could not send a request to Ichibot server: not connected`) };
    return this.rpc.call(method, {auth: this.auth, ...arg, context: this.context}) as ReturnType<IchibotRPC[T]>;
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

  private isConnected: boolean = false;
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
    const { initLines } = this.opts.readInitFile(this.auth.exchange ?? 'ftx');
    if (this.context) {
      initLines.push(`instrument ${this.context.currentInstrument || '*'}`);
    }

    return this.callRpc('reloadInit', { initLines, ...this.auth })
  }

  public async login() {
    if (!this.auth) {
      return;
    }

    if (!this.rpc) {
      await this.connect();
    }

    const { initLines } = this.opts.readInitFile(this.auth.exchange ?? 'ftx');
    if (this.context) {
      initLines.push(`instrument ${this.context.currentInstrument || '*'}`);
    }

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
    this.opts.clientDB.delete(getCookieSaveKey(this.opts.wsUrl, auth?.friendlyName ?? 'default'));
    this.auth = null;
    this.output.log('Done.');
  }

  public async handleQuit() {
    while (this.activeLoginsByFriendlyName.size > 0) {
      if (!this.isConnected) {
        this.applyAuthFromStore(null, Array.from(this.activeLoginsByFriendlyName.values())[0] ?? null);
        await this.connect();
      }
      const auth = this.auth;
      this.output.log(`Signing out from ${this.auth?.friendlyName}...`);
      await this.callRpc('bye', {}).catch(() => null);
      this.activeLoginsByFriendlyName.delete(auth?.friendlyName ?? 'default');
      await this.close();
      this.opts.clientDB.delete(getCookieSaveKey(this.opts.wsUrl, auth?.friendlyName ?? 'default'));
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

        if (this.isConnected) {
          this.output.log('Closing existing connection...')
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
              'Exchange (b)inance futs, (s)pot or (f)tx: ',
              (s) => ['b', 's', 'f'].includes(s[0].toLowerCase()))).substring(0,1).toLowerCase();

          const exchange: ExchangeLabel = exchangeLabelAnswer === 'b' ? 'binance' : exchangeLabelAnswer === 's' ? 'binance-spot' : 'ftx';

          const apiKey = (await requestUntilValid('Your API key: ', (s) => !!s));
          const apiSecret = (await requestUntilValid('Your API secret: ', (s) => !!s));
          const subAccount = exchange === 'ftx' ? (await requestUntilValid('Your FTX subaccount name (leave empty for none): ', () => true)) : '';
          const friendlyName = (await requestUntilValid('Name these credentials (empty = "default"): ', () => true)) || 'default';

          this.auth = { apiKey, apiSecret, subAccount, exchange, friendlyName };
          this.opts.clientDB.push(getAuthSaveKey(friendlyName), this.auth);
          this.output.log('API key saved. To clear current credentials please type "logout".')
        }

        await this.login().catch((err) => {
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

    if (!this.isConnected && !this.isInLoginProcess) {
      this.output.log(`Lost connection to server, wait until reconnected.`);
      this.notifyReconnect = true;
      return { success: false, message: 'Not connected' };
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
      }
      return result;
    });
  }
}
