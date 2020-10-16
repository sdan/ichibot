import {EventEmitter} from "events";
import WebSocket, { ErrorEvent } from "ws";

export const MAXIMUM_RECONNECT_DELAY = 60000;

export interface WebSocketMessageEvent { data: WebSocket.Data; type: string; target: WebSocket; }
export interface WebSocketCloseEvent { wasClean: boolean; code: number; reason: string; target: WebSocket; }
export interface WebSocketOpenEvent { target: WebSocket; }
export interface WebSocketError extends Error {
  error: any;
  message: string;
  type: string;
  target: WebSocket;
}

export interface WebsocketOptions {
  url: string | ConnectionUrlBuilder;
  heartbeatTimeout?: number;
  heartbeatLogEvery?: number; // If provided, will log "Heartbeat OK" every this many heartbeat checks
  heartbeatInterval?: number;
  heartbeat?: boolean;
  heartbeatPingMessage?: string | (() => void); // What do we send as ping; if function, does whatever.

  /** If false but heartbeat true, only receive heartbeats (assuming they are automatic or something)
   * If true, also send 'ping' messages on interval
   */
  heartbeatPoll?: boolean;
  logMessages?: boolean;
  logger?: (...args: any[]) => void;
}

type ConnectionUrlBuilder = () => string;

export enum WSEventName {
  OPENED = "opened",
  CLOSED = "closed",
  MESSAGE = "message",
}

export default class ReconnectingWebsocket extends EventEmitter {
  private url: string | ConnectionUrlBuilder;

  private ws: WebSocket | null = null;

  private reconnectCounter: number = 0;
  private awaitingReconnect: boolean = false;
  private lastMessageReceived: number = 0;

  private heartbeatCounter: number = 0;
  private heartbeatCheckInterval: NodeJS.Timer  | null = null;
  private heartbeatPoll: boolean;
  private opts: WebsocketOptions;

  constructor(opts: WebsocketOptions) {
    super();

    this.opts = opts;

    this.url = opts.url;
    this.awaitingReconnect = false;

    // Heartbeat handling
    this.lastMessageReceived = Date.now();
    this.on(WSEventName.MESSAGE, () => {
      this.lastMessageReceived = Date.now();
    });
    this.heartbeatCounter = 0;
    this.heartbeatPoll = opts.heartbeatPoll === undefined ? true : opts.heartbeatPoll;

    if (opts.heartbeat === undefined || opts.heartbeat) {
      const pingMessage = opts.heartbeatPingMessage || 'ping';
      this.on(WSEventName.OPENED, () => {
        if (this.heartbeatCheckInterval) {
          clearInterval(this.heartbeatCheckInterval);
        }
        this.heartbeatCheckInterval = setInterval(() => {
          this.heartbeatCounter++;
          if (opts.heartbeatLogEvery && this.heartbeatCounter % opts.heartbeatLogEvery === 0) {
            this.logger("Heartbeat OK");
          }
          const heartbeatTimeout: number = opts.heartbeatTimeout || 60 * 1000;
          if (Date.now() > this.lastMessageReceived + heartbeatTimeout) {
            this.logger(`No heartbeat received in ${heartbeatTimeout}ms. Reconnecting websocket.`);
            if (this.ws) {
              this.ws.close();
            }
            this.reconnect();
          }
          try {
            // This check can fail at least if connection was recently dropped and reconnection hasn't taken place yet.
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              if (this.heartbeatPoll) {
                if (typeof(pingMessage) === 'string') {
                  this.ws.send(pingMessage);
                } else if (typeof(pingMessage) === 'function') {
                  pingMessage();
                } else {
                  throw new Error('Unexpected pingMessage type: expected string or function');
                }
              }
            }
          } catch (err) {
            this.logger("Failed sending heartbeat ping:", err);
          }
        }, opts.heartbeatInterval || 10000);
      });
    }
  }

  private logger = (...args: any[]): void => {
    if (this.opts.logMessages) {
      (this.opts.logger || console.log)(...args);
    }
  }

  public connect = (url?: string | ConnectionUrlBuilder) => {
    if (url) {
      this.url = url;
    }

    // If for some reason we have a lingering connection (or just the object), close & remove first
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      const ws = this.ws = new WebSocket(this.getUrl());
      ws.onerror = this.handleError;
      ws.onclose = this.handleClose;
      ws.onmessage = this.handleMessage;
      ws.onopen = this.handleOpen;
    } catch (err) {
      // Creating a connection can fail sometimes
      this.reconnect();
    }

    return this;
  }

  public disconnect = () => {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // End this. No reconnection. Ever.
  public end = () => {
    if (this.ws) {
      this.ws.removeAllListeners();
    }
    this.removeAllListeners();
    this.disconnect();
  }

  public handleError = (error: ErrorEvent) => {
    console.error("WebSocket error", error);
    this.emit("error", error);

    this.reconnect();
  }

  public reconnect = () => {
    if (this.awaitingReconnect) {
      return;
    }

    this.emit("reconnecting");

    this.awaitingReconnect = true;
    const timeout = Math.min(1000 * Math.pow(1.5, this.reconnectCounter++), MAXIMUM_RECONNECT_DELAY);

    this.logger(`Attempting to reconnect in ${timeout / 1000} seconds`);

    setTimeout(() => {
      this.awaitingReconnect = false;
      this.connect();
    }, timeout);
  }

  public handleClose = (event: WebSocketCloseEvent) => {
    this.logger("WebSocket closed");
    this.emit(WSEventName.CLOSED);
    this.ws = null;

    // Abnormal close
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  public handleMessage = (event: WebSocketMessageEvent) => {
    if (this.opts.logMessages) {
      this.logger('WS IN:', event.data);
    }
    this.lastMessageReceived = Date.now();
    if (event.data === "pong") {
      return;
    }
    this.emit(WSEventName.MESSAGE, event);
  }

  public handleOpen = (event: WebSocketOpenEvent) => {
    this.logger("WebSocket opened to", this.getUrl());
    this.reconnectCounter = 0;
    this.emit(WSEventName.OPENED, event);
  }

  /**
   * Like .on('open', ...) but additionally triggers immediately if a connection is already open.
   * This should simplify setting up subscription type operations a bit.
   */
  public onceEveryOpen = (cb: (event: WebSocketOpenEvent) => void) => {
    // If already open, trigger immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      cb({target: this.ws});
    }

    // Trigger whenever (re-)connected
    this.on(WSEventName.OPENED, cb);
  }

  public send = (message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        if (this.opts.logMessages) {
          this.logger('WS OUT:', message);
        }
        this.ws.send(message, (err: Error | undefined) => {
          if (err) {
            console.error(`Unexpected websocket error:`, err);
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error(`Cannot send WS: no ws object`));
      }
    })
  }

  public sendJS = (message: object): Promise<void> => {
    return this.send(JSON.stringify(message));
  }

  public getUrl: () => string = () => {
    return (typeof this.url === "function") ? this.url() : this.url;
  }
}
