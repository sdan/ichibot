export const SUPPORTED_EXCHANGES = ['binance', 'binance-spot', 'ftx'] as const;
export type ExchangeLabel = typeof SUPPORTED_EXCHANGES[number];

export interface ApiKey {
  live: boolean;
  id: string | null;
  secret: string | null;
  subAccount?: string | null; // Used at least on FTX
  passphrase?: string;
}
