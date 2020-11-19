import { IchibotRPC, AuthArgs, MessageNotification, ContextNotification, GlobalContext, ALL_SYM, APP_VERSION } from '../shared/ichibotrpc_types';
import * as RPC from 'rpc-websockets';
import { ParameterType, Logger, isReplacementDefinition } from '../shared/util';
import { CONSOLE_COLORS } from './constants';

const CLIENT_VERSION = APP_VERSION;

const COL = CONSOLE_COLORS;

export interface ClientDB {
  push: (key: string, value: any) => void;
}

export interface IchibotClientOpts {
  wsUrl: string;
  getDataSafe: <T>(path: string, defaultValue: T) => T;
  logger: Logger;
  readInitFile: (filename?: string) => {initLines: string[]};
  saveCmdToInit: (filename: string | null, contextSymbol: string, lineMatchers: Array<string | null>, cmd: string) => void;
  debug?: boolean;
  clientDB: ClientDB;
  io: {
    query?: (q: string) => Promise<string>;
    setPrompt: (p: string) => void;
  }
}

export default class IchibotClient {
  private rpc: RPC.Client;
  private auth: AuthArgs['auth'] | null = null;
  private context: GlobalContext | null = null;

  private output: Logger;

  public lastPokeResponse: number = Infinity;

  constructor(private opts: IchibotClientOpts)  {
    const {wsUrl, getDataSafe} = opts;

    this.output = opts.logger;

    this.rpc = new RPC.Client(wsUrl, {
      autoconnect: false,
      reconnect: true,
      max_reconnects: 99999,
    });

    this.auth = getDataSafe('/auth', null);
  }

  private logError = (err: Error & {code?: number}) => {
    if (err.code === 401) {
      this.output.error(`Not logged in. Your API key may not be correct.`)
    } else {
      this.output.error(`Error from the server: ${err.message}`);
    }
  }

  private callRpc<T extends keyof IchibotRPC>(method: T, arg: Omit<ParameterType<IchibotRPC[T]>, 'auth'>): ReturnType<IchibotRPC[T]> {
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

  public async start() {
    this.refreshPrompt();

    let dcTimeout: NodeJS.Timeout | null = null;
    let notifyReconnect = false;

    this.rpc.connect();
    this.rpc.on('error', () => {
      if (dcTimeout === null) {
        this.output.error('Connection error to the server. Trying to reconnect...');
      }
    });
    this.rpc.on('open', () => {
      this.isConnected = true;
      if (dcTimeout !== null) {
        if (notifyReconnect) {
          this.output.log('Reconnected');
        }
        clearTimeout(dcTimeout);
      } else {
        this.output.log('Connection open');
      }
      notifyReconnect = false;
      this.login();
    });
    this.rpc.on('close', () => {
      this.isConnected = false;
      dcTimeout = setTimeout(() => {
        this.output.log('Connection closed, trying to reconnect...');
      }, 10000)
    });
    this.rpc.on('feed', (msg: MessageNotification['params']) => {
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
    this.rpc.on('context', (msg: ContextNotification['params']) => {
      this.context = msg;
      this.refreshPrompt();
    })

    this.output.log(`Initializing...`);

    const POKE_INTERVAL = 5000;
    setInterval(() => {
      if (!this.isConnected) {
        return;
      }
      this.callRpc('poke', {})
        .then(() => {
          this.lastPokeResponse = Date.now();
        })
        .catch(this.logError);
    }, POKE_INTERVAL);


    await new Promise((resolve, _reject) => {
      this.rpc.once('open', () => {
        resolve();
      });
    })



    this.refreshPrompt();

    if (!this.auth) {
      this.output.log(`It seems you have not inserted your API key yet. Please type 'login' to start.`);
    } else {
      // await this.login().catch(this.logError);
    }

    const done = false;

    while (!done) {
      try {

        const answer = (await this.query(this.getPromptText())).trim();
        if (!this.isConnected) {
          this.output.log(`Lost connection to server, wait until reconnected.`);
          notifyReconnect = true;
          continue;
        }

        this.output.log(COL.Dim, ':::', answer);
        if (answer.length > 0) {
          const result = this.processCommand(answer)
            .then((res) => {
              if (!res?.success) {
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

  public async login() {
    if (!this.auth) {
      return;
    }

    const { initLines } = this.opts.readInitFile();
    if (this.context) {
      initLines.push(`instrument ${this.context.currentInstrument || '*'}`);
    }

    const result = await this.callRpc('hello', {name: 'donut', version: CLIENT_VERSION, initLines});

    if (result.version > CLIENT_VERSION) {
      this.output.warn(``);
      this.output.warn(`The server reports a higher app version than this client. This will probably not work for you until you upgrade your client version, but you can try.`);
      this.output.warn(``);
    }

    this.output.debug(`Login steps done.`);
    return;
  }

  public async logout() {
    this.output.log(`Signing out...`);
    await this.callRpc('bye', {});
    this.output.log('Clearing your credentials...')
    this.auth = null;
    this.opts.clientDB.push('/auth', this.auth);
    this.output.log('Done.');
  }

  async processCommand(cmd: string): Promise<any> {
    const [a, b, ...rest] = cmd.split(/\s+/).map((p) => p.trim());

    // Comment
    if (a.startsWith('#')) {
      return;
    }

    if (a === 'login') {
      const apiKey = (await this.query('Your API key: ')).trim();
      const apiSecret = (await this.query('Your API secret: ')).trim();
      const subAccount = (await this.query('Your FTX subaccount name (leave empty for none): ')).trim();

      if (!apiKey || !apiSecret) {
        this.output.log('Key or secret empty. Try again.');
        return;
      }

      this.auth = { apiKey, apiSecret, subAccount };
      this.opts.clientDB.push('/auth', this.auth);
      this.output.log('API key saved. To clear current credentials please type "logout".')
      await this.login();
      return;
    } else {
      if (!this.auth) {
        this.output.log(`It seems you have not inserted your API key yet. Please type 'login' to start.`);
        return;
      }
    }

    if (a === 'logout') {
      await this.logout().catch(this.logError);
      return;
    }

    if (['exit', 'quit', 'q'].includes(a)) {
      this.output.log(`Signing out...`);
      this.callRpc('bye', {}).catch(() => null);
      process.exit(0);
    }

    if (!this.context) {
      this.output.warn(`Not ready. Cannot execute command yet.`);
      return;
    }

    const currentInstrument = this.context.currentInstrument;

    return this.callRpc('rawcmd', {cmd: cmd, debug: this.opts.debug}).then((result) => {
      if (result.success) {
        if (a === 'alias' && rest.length > 0) {
          this.opts.saveCmdToInit(null, currentInstrument ?? ALL_SYM, [a, b, null], cmd);
        } else if (isReplacementDefinition(cmd)) {
          this.opts.saveCmdToInit(null, currentInstrument ?? ALL_SYM, [a, b.replace(':', '')], cmd);
        } else if (a === 'fatfinger' && b && currentInstrument !== null) {
          this.opts.saveCmdToInit(null, currentInstrument, [a], cmd);
        } else if (a === 'set' && /^[a-zA-Z0-9]+$/.test(b) && rest.length === 1) {
          this.opts.saveCmdToInit(null, currentInstrument ?? ALL_SYM, [a, b], cmd);
        }
      }
      return result;
    });
  }
}
