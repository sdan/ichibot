export interface ApiKey {
  live: boolean;
  id: string | null;
  secret: string | null;
  subAccount?: string | null; // Used at least on FTX
  passphrase?: string;
}
