import type { Game } from "./types";
import { modernText } from "./copy";
import LZString from "lz-string";
const PREFIX = "ming-campaign-v1-";
function checksum(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
export function encode(g: Game) {
  const payload = JSON.stringify(g);
  return JSON.stringify({
    format: "ming-save",
    version: 1,
    checksum: checksum(payload),
    payload,
  });
}
export function decode(input: string): Game {
  if (input.length > 30_000_000)
    throw new Error("存档超过 30 MB，请检查文件。");
  let data: any;
  try {
    data = JSON.parse(input);
  } catch {
    throw new Error("这不是可读取的存档文件。");
  }
  if (
    data?.format !== "ming-save" ||
    data.version !== 1 ||
    typeof data.payload !== "string" ||
    checksum(data.payload) !== data.checksum
  )
    throw new Error("存档格式或校验不符，原有存档未被更改。");
  let g: any;
  try {
    g = JSON.parse(data.payload);
  } catch {
    throw new Error("存档内容损坏。");
  }
  const finite = (x: any) => typeof x === "number" && Number.isFinite(x);
  const numKeys = (o: any, keys: string[]) =>
    o && keys.every((k) => finite(o[k]));
  const arr = (x: any) => Array.isArray(x) && x.length <= 50000;
  const textKeys = (o: any, keys: string[]) =>
    o && keys.every((k) => typeof o[k] === "string" && o[k].length < 20000);
  if (
    g?.version !== 1 ||
    !numKeys(g, [
      "day",
      "seed",
      "rng",
      "nextId",
      "treasury",
      "granary",
      "deaths",
      "diversion",
      "lastPetition",
    ]) ||
    g.day < 0 ||
    g.day > 108000 ||
    !Number.isInteger(g.day) ||
    !arr(g.regions) ||
    g.regions.length !== 8 ||
    !arr(g.people) ||
    g.people.length < 4 ||
    !arr(g.reports) ||
    !arr(g.mail) ||
    !arr(g.commands) ||
    !arr(g.history) ||
    !arr(g.annual) ||
    !["victory", "defeat", "retired", null].includes(g.ended)
  )
    throw new Error("存档缺少必要的王朝记录。");
  if (
    !numKeys(g.court, ["authority", "education", "arms", "tax"]) ||
    typeof g.court.delegated !== "boolean" ||
    !numKeys(g.foreign, ["pressure", "truce", "trade"]) ||
    !numKeys(g.ruler, ["born", "generation", "ends", "heirAge"]) ||
    typeof g.ruler.name !== "string" ||
    !numKeys(g.ledger, [
      "minted",
      "consumed",
      "lost",
      "initialSilver",
      "grown",
      "eaten",
      "spoiled",
      "initialGrain",
    ])
  )
    throw new Error("存档制度记录不完整。");
  if (
    !g.regions.every(
      (r: any) =>
        textKeys(r, ["id", "name"]) &&
        numKeys(r, [
          "population",
          "grain",
          "silver",
          "army",
          "unrest",
          "infrastructure",
          "harvest",
          "ledgerGrain",
          "ledgerPopulation",
          "ledgerSilver",
          "governor",
        ]) &&
        r.population >= 0 &&
        r.grain >= 0 &&
        r.silver >= 0 &&
        typeof r.control === "boolean",
    ) ||
    new Set(g.regions.map((r: any) => r.id)).size !== 8 ||
    !g.regions.some((r: any) => r.id === g.capital)
  )
    throw new Error("存档地方记录不完整。");
  if (
    !g.people.every(
      (p: any) =>
        textKeys(p, ["id", "name", "role", "portrait", "voice"]) &&
        numKeys(p, ["born", "skill", "rent", "network"]) &&
        typeof p.retired === "boolean",
    ) ||
    !g.people.some((p: any) => !p.retired)
  )
    throw new Error("存档官员记录不完整。");
  const policies = [
    "relief",
    "audit",
    "pay",
    "defend",
    "campaign",
    "peace",
    "trade",
    "irrigation",
    "tax",
    "school",
    "arms",
    "appoint",
    "observe",
    "delegate",
    "relocate",
    "recover",
  ];
  if (
    ![...g.reports, ...g.mail].every(
      (r: any) =>
        numKeys(r, ["id", "written", "received"]) &&
        textKeys(r, [
          "title",
          "source",
          "person",
          "region",
          "domain",
          "body",
        ]) &&
        arr(r.facts) &&
        r.facts.every((f: any) => textKeys(f, ["label", "value"])) &&
        arr(r.options) &&
        r.options.every((p: any) => policies.includes(p)) &&
        ["read", "resolved", "decision"].every(
          (k) => typeof r[k] === "boolean",
        ) &&
        ["claimSilver", "claimGrain", "claimPopulation"].every(
          (k) => r[k] === undefined || finite(r[k]),
        ),
    )
  )
    throw new Error("存档奏报记录不完整。");
  // Upgrade pre-release saves which predate explicit in-transit accounts.
  for (const c of g.commands) {
    if (c.transit === undefined) {
      c.transit = 0;
      c.funded = Boolean(c.executed);
    }
  }
  if (
    !g.commands.every(
      (c: any) =>
        policies.includes(c.policy) &&
        textKeys(c, ["region", "executor", "outcome"]) &&
        numKeys(c, [
          "id",
          "issued",
          "arrives",
          "returns",
          "budget",
          "spent",
          "delivered",
          "loss",
          "transit",
        ]) &&
        typeof c.funded === "boolean" &&
        typeof c.executed === "boolean" &&
        typeof c.reported === "boolean",
    ) ||
    !g.history.every(
      (h: any) => numKeys(h, ["day"]) && textKeys(h, ["text"]),
    ) ||
    !g.annual.every(
      (a: any) =>
        numKeys(a, [
          "day",
          "population",
          "grain",
          "treasury",
          "controlled",
          "deaths",
          "diversion",
        ]) &&
        (a.claimedTreasury === null || finite(a.claimedTreasury)),
    )
  )
    throw new Error("存档履历记录不完整。");
  for (const r of [...g.reports, ...g.mail]) r.body = modernText(r.body);
  for (const p of g.people) p.voice = modernText(p.voice);
  return g as Game;
}
export function pack(g: Game) {
  return "MINGZ1:" + LZString.compressToUTF16(encode(g));
}
export function unpack(s: string) {
  const plain = s.startsWith("MINGZ1:")
    ? LZString.decompressFromUTF16(s.slice(7))
    : s;
  if (!plain) throw new Error("存档压缩内容损坏。");
  return decode(plain);
}
export function save(g: Game, slot = "auto") {
  localStorage.setItem(PREFIX + slot, pack(g));
}
export function load(slot = "auto") {
  const s = localStorage.getItem(PREFIX + slot);
  return s ? unpack(s) : null;
}
export function slotInfo(slot: string) {
  try {
    const g = load(slot);
    return g ? { day: g.day, name: g.ruler.name, ended: g.ended } : null;
  } catch {
    return { day: 0, name: "存档损坏，可导入备份", ended: null };
  }
}
