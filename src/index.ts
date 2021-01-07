import readline, { clearLine, cursorTo } from 'readline';
import { getInitInstrument, Logger } from './shared/util';
import { JsonDB } from 'node-json-db';
import { Config as JsonDBConfig } from 'node-json-db/dist/lib/JsonDBConfig';
import { join as pathJoin } from 'path';
import { writeFileSync, existsSync, readFileSync, renameSync } from 'fs';
import { flatten } from 'ramda';
import IchibotClient from './client/ichibotclient';
import { CONSOLE_COLORS } from './client/constants';
import { ExchangeLabel } from './shared/types';

const COL = CONSOLE_COLORS;

const clientDB = new JsonDB(new JsonDBConfig('ichibot-config-db', true, true));
const LOG_TIMESTAMPS = !!process.env.LOG_TIMESTAMPS;

const getDataSafe = <T>(path: string, defaultValue: T): T => {
  if (clientDB.exists(path)) {
    return clientDB.getData(path);
  } else {
    return defaultValue;
  }
}

const INIT_FILE_OLD_PATH = pathJoin(process.cwd(), 'initrun.txt');
const getInitFilePath = (exchange: ExchangeLabel): string => pathJoin(process.cwd(), `initrun.${exchange}.txt`);

if (existsSync(INIT_FILE_OLD_PATH)) {
  renameSync(INIT_FILE_OLD_PATH, getInitFilePath('ftx'));
}

function readInitFile(exchange: ExchangeLabel): {initLines: string[]} {
  if (!exchange) { // Legacy. Currently not possible to create auth without exchange but old data may have it so
    exchange = 'ftx';
  }

  const filename = getInitFilePath(exchange);
  if (!existsSync(filename)) {
    output.log(`Initfile ${filename} doesn't exist yet. Skipping user init script. If this is your first run or you didn't define any aliases yet, this is expected. If you do have a premade initfile make sure it's named exactly as shown.`);
    return {initLines: []};
  }

  // Get lines & drop some extra ones. It doesn't matter if comments and empty lines are in but server doesn't need them either.
  const initLines = readFileSync(filename).toString().split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !l.startsWith('#'));

  return {
    initLines
  };
}

// If cmd is null this is a removal
function saveCmdToInit(exchange: ExchangeLabel, contextSymbol: string, lineMatchers: Array<string | null>, cmd: string | null): void {
  if (!exchange) { // Legacy. Currently not possible to create auth without exchange but old data may have it so
    exchange = 'ftx';
  }

  const filename = getInitFilePath(exchange);

  const symFriendlyName = contextSymbol === '*' ? 'global' : contextSymbol;
  if (cmd) {
    output.log(`Writing command "${cmd}" to ${symFriendlyName} initialization steps.`)
  } else {
    output.log(`Removing command "${lineMatchers[0]} ${lineMatchers[1]}" from ${symFriendlyName} initialization steps.`)
  }

  const cmdWords = cmd?.split(/\s+/)
    .map((a) => a.trim())
    .filter((a) => a !== '');

  const initLines = existsSync(filename)
    ? readFileSync(filename).toString().split('\n').map((l) => l.trim())
    : [];

  const linesPerSym: Array<{sym: string, lines: string[]}> = [];
  let currentInstrument = getInitInstrument(exchange);

  let currentSymBlock: {sym: string, lines: string[]} = {sym: currentInstrument, lines: []};

  for (const l of initLines) {
    const args = l.split(/\s+/).map((a) => a.trim());

    if (args[0] === 'instrument' && args.length > 1 && args[1].toUpperCase() !== currentInstrument) {
      linesPerSym.push(currentSymBlock);
      currentSymBlock = {sym: args[1].toUpperCase(), lines: []};
      currentInstrument = currentSymBlock.sym;
    }

    currentSymBlock.lines.push(l);
  }

  linesPerSym.push(currentSymBlock);

  const symBlock = linesPerSym.find((b) => b.sym === contextSymbol)
    ?? {sym: contextSymbol, lines: [`instrument ${contextSymbol}`, `### DEFINE ${symFriendlyName} aliases here`]};

  if (!linesPerSym.includes(symBlock)) {
    linesPerSym.push(symBlock);
  }

  const isMatch = (l: string) => {
    const args = l.split(/\s+/)
      .map((a) => a.trim())
      .filter((a) => a !== '');

    for (let i = 0; i < lineMatchers.length; ++i) {
      if (args[i] === undefined || lineMatchers[i] !== null && lineMatchers[i]?.toLowerCase() !== args[i].toLowerCase().replace(':', '')) {
        return false;
      }
    }
    return true;
  }

  const matchingLineIdx = symBlock.lines.findIndex(isMatch);

  const removeMarker = '#TOBEREMOVED#';

  if (matchingLineIdx > -1) {
    symBlock.lines[matchingLineIdx] = cmdWords?.join(' ') ?? removeMarker;
  } else if (cmdWords) {
    symBlock.lines.push(cmdWords.join(' '));
  }

  const newInitLines = flatten(linesPerSym.map((b) => b.lines)).filter((l) => l !== removeMarker);

  writeFileSync(filename, newInitLines.join('\n'));
};

// process.env.SERVER_URL = 'ws://ichibot.trade.local:8888'
const wsUrl = process.env.SERVER_URL || 'wss://beta.ichibot.trade:443';

export interface Config {
  exchange: ExchangeLabel;
  apiKey: string;
  apiSecret: string;
  subAccount?: string;
  rateLimit?: [number, number];
}

process.stdin.removeAllListeners('data');


let getCommandCompletions: readline.Completer = (s) => {
  return [[], s];
}

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: (s: string) => getCommandCompletions(s),
  prompt: 'command:'
});

function query(msg: string): Promise<string> {
  return new Promise((resolve, _reject) => r1.question(msg, resolve))
}

const output: Logger = {
  log: (...args: any[]): void => {
    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
    console.log([
      ...(LOG_TIMESTAMPS ? [new Date().toISOString()] : []),
      args.map((x) =>
        typeof x === 'string' ? x : JSON.stringify(x)
      )
      .join(' '), COL.Reset].join(' '));
    r1.prompt(true);
  },
  dir: (...args: Array<{[k: string]: any}>): void => {
    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
    for (const arg of args) {
      for (const k of Object.keys(arg)) {
        console.log([COL.Dim, `${k}:`, COL.Bright, `${arg[k]}`].join(' '));
      }
    }
    r1.prompt(true);
  },
  warn: (...args: any[]): void => output.log(COL.FgYellow, 'WARN:', ...args),
  error: (...args: any[]): void => output.log(COL.FgRed, 'ERROR:', ...args),
  debug: (...args: any[]): void => {
    if (DEBUG) {
      output.log('DEBUG:', ...args)
    }
  }
}

const DEBUG = !!process.env.DEBUG;

function setPrompt(p: string) {
  r1.setPrompt(p);
  r1.prompt();
}

async function go() {
  const bot = new IchibotClient({
    wsUrl, getDataSafe, logger: output,
    debug: DEBUG, readInitFile, saveCmdToInit, clientDB,
    process: {
      exit: (ret) => process.exit(ret),
    },
    io: {
      setPrompt,
      query,
    }
  });
  await bot.start();
}

go();
