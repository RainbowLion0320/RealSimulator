export type Policy =
  | "relief"
  | "audit"
  | "pay"
  | "defend"
  | "campaign"
  | "peace"
  | "trade"
  | "irrigation"
  | "tax"
  | "school"
  | "arms"
  | "appoint"
  | "observe"
  | "delegate"
  | "relocate"
  | "recover";
export type Domain = "钱粮" | "民生" | "边务" | "朝政" | "外交" | "工务";
export interface Person {
  id: string;
  name: string;
  role: string;
  born: number;
  portrait: string;
  voice: string;
  skill: number;
  rent: number;
  network: number;
  retired: boolean;
}
export interface Region {
  id: string;
  name: string;
  population: number;
  grain: number;
  silver: number;
  army: number;
  unrest: number;
  infrastructure: number;
  harvest: number;
  control: boolean;
  ledgerGrain: number;
  ledgerPopulation: number;
  ledgerSilver: number;
  governor: number;
}
export interface Report {
  id: number;
  title: string;
  source: string;
  person: string;
  region: string;
  domain: Domain;
  written: number;
  received: number;
  body: string;
  facts: { label: string; value: string }[];
  options: Policy[];
  decision: boolean;
  read: boolean;
  resolved: boolean;
  claimGrain?: number;
  claimSilver?: number;
  claimPopulation?: number;
}
export interface Command {
  id: number;
  policy: Policy;
  region: string;
  issued: number;
  arrives: number;
  returns: number;
  executor: string;
  budget: number;
  spent: number;
  delivered: number;
  loss: number;
  transit: number;
  funded: boolean;
  executed: boolean;
  reported: boolean;
  outcome: string;
}
export interface RecordEntry {
  day: number;
  text: string;
}
export interface YearRecord {
  day: number;
  population: number;
  grain: number;
  treasury: number;
  claimedTreasury: number | null;
  controlled: number;
  deaths: number;
  diversion: number;
}
export interface Ledger {
  minted: number;
  consumed: number;
  lost: number;
  initialSilver: number;
  grown: number;
  eaten: number;
  spoiled: number;
  initialGrain: number;
}
export interface Game {
  version: 1;
  seed: number;
  rng: number;
  day: number;
  nextId: number;
  treasury: number;
  granary: number;
  regions: Region[];
  people: Person[];
  reports: Report[];
  mail: Report[];
  commands: Command[];
  history: RecordEntry[];
  annual: YearRecord[];
  ledger: Ledger;
  foreign: { pressure: number; truce: number; trade: number };
  court: {
    authority: number;
    education: number;
    arms: number;
    tax: number;
    delegated: boolean;
  };
  ruler: {
    name: string;
    born: number;
    generation: number;
    ends: number;
    heirAge: number;
  };
  capital: string;
  ended: null | "victory" | "defeat" | "retired";
  deaths: number;
  diversion: number;
  lastPetition: number;
}
