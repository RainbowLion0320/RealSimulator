import { describe, it, expect } from "vitest";
import {
  advance,
  ask,
  invariants,
  issue,
  newGame,
  pending,
  retire,
  view,
} from "../src/sim/engine";
import { decode, encode, pack, unpack } from "../src/sim/save";
import { dateOf } from "../src/sim/data";
import type { Game, Policy } from "../src/sim/types";
function settlePetitions(g: Game, choice: Policy = "observe") {
  for (const r of pending(g))
    issue(
      g,
      r.options.includes(choice) ? choice : r.options[0],
      r.region,
      r.id,
    );
}
function simulate(g: Game, target: number, choice: Policy = "observe") {
  let steps = 0;
  while (g.day < target && !g.ended) {
    settlePetitions(g, choice);
    const elapsed = advance(g, Math.min(30, target - g.day));
    if (!elapsed) throw new Error(`stalled at ${g.day}`);
    if (++steps > 15000) throw new Error("loop");
  }
}
describe("causal engine", () => {
  it("compressed local saves round-trip and preserve legacy file support", () => {
    const a = newGame(737);
    simulate(a, 1200);
    expect(unpack(pack(a))).toEqual(a);
    expect(unpack(encode(a))).toEqual(a);
    expect(pack(a).length).toBeLessThan(encode(a).length / 2);
  });
  it("modernizes legacy wording without changing reported facts or randomness", () => {
    const a = newGame(7);
    a.reports[0].body = "地方称存粮渐少，请朝廷早筹接济。";
    const b = decode(encode(a));
    expect(b.reports[0].body).toBe(
      "地方官说，存粮越来越少，希望朝廷早点安排救济。",
    );
    expect(b.reports[0].facts).toEqual(a.reports[0].facts);
    expect(b.rng).toBe(a.rng);
    expect(b.day).toBe(a.day);
  });
  it("keeps funded money in transit until execution and conserves every phase", () => {
    const a = newGame(52);
    settlePetitions(a);
    issue(a, "irrigation", "south");
    advance(a, 2);
    const c = a.commands[0];
    expect(c.funded).toBe(true);
    expect(c.executed).toBe(false);
    expect(c.transit).toBeGreaterThan(0);
    expect(c.delivered).toBe(0);
    expect(Math.abs(invariants(a).silverError)).toBeLessThan(1e-7);
    simulate(a, 200);
    expect(c.transit).toBe(0);
    expect(c.delivered).toBeGreaterThan(0);
    expect(Math.abs(invariants(a).silverError)).toBeLessThan(1e-7);
  });
  it("dates start in July and reach exactly 300 simulation years", () => {
    expect(dateOf(0)).toBe("1582年7月1日");
    expect(dateOf(108000)).toBe("1882年7月1日");
  });
  it("same seed and choices continue identically after save/load", () => {
    const a = newGame(42);
    simulate(a, 400);
    const b = decode(encode(a));
    simulate(a, 1000);
    simulate(b, 1000);
    expect(b).toEqual(a);
  });
  it("opening reports and public views does not reroll the world", () => {
    const a = newGame(123),
      before = encode(a);
    for (let i = 0; i < 20; i++) view(a);
    expect(encode(a)).toBe(before);
    const old = structuredClone(a.reports[1]);
    simulate(a, 360);
    expect(a.reports.find((r) => r.id === old.id)).toEqual(old);
  });
  it("silver and grain are conserved over mixed commands, seasons and wars", () => {
    const a = newGame(839);
    settlePetitions(a);
    for (const p of [
      "relief",
      "pay",
      "defend",
      "campaign",
      "peace",
      "trade",
      "irrigation",
      "tax",
      "school",
      "arms",
      "audit",
      "appoint",
    ] as Policy[])
      issue(a, p, "north");
    simulate(a, 3600);
    const inv = invariants(a);
    expect(Math.abs(inv.silverError)).toBeLessThan(1e-7);
    expect(Math.abs(inv.grainError)).toBeLessThan(1e-6);
    expect(
      a.regions.every(
        (r) => r.silver >= 0 && r.grain >= 0 && r.population >= 0,
      ),
    ).toBe(true);
  });
  it("cannot issue a resolved decision twice or spend unauthorized option", () => {
    const a = newGame(1),
      r = a.reports[0];
    expect(issue(a, "school", r.region, r.id)).toBe(false);
    expect(issue(a, "pay", r.region, r.id)).toBe(true);
    expect(issue(a, "pay", r.region, r.id)).toBe(false);
  });
  it("received requests pause time; secret scheduled messages do not pause early", () => {
    const a = newGame(11);
    expect(advance(a, 30)).toBe(0);
    settlePetitions(a);
    expect(advance(a, 30)).toBe(12);
    expect(a.day).toBe(12);
    expect(pending(a)[0].title).toContain("边市");
  });
  it("expenditure cannot exceed actual funds; execution replies arrive later", () => {
    const a = newGame(99);
    settlePetitions(a);
    a.treasury = 0;
    issue(a, "campaign", "north");
    const c = a.commands[0];
    expect(c.executed).toBe(false);
    advance(a, 10);
    expect(c.spent).toBe(0);
    simulate(a, 120);
    expect(c.spent).toBeLessThanOrEqual(c.budget);
    expect(c.reported).toBe(true);
  });
  it("normal view excludes actual stocks, traits, incoming mail and execution truth", () => {
    const a = newGame(19);
    issue(a, "audit", "north");
    const v = view(a);
    expect(v.settlement).toBeNull();
    for (const key of [
      "treasury",
      "granary",
      "court",
      "foreign",
      "rng",
      "mail",
      "ledger",
    ])
      expect(v).not.toHaveProperty(key);
    expect(v.people[0]).not.toHaveProperty("rent");
    expect(v.regions[0]).not.toHaveProperty("grain");
    expect(v.commands[0]).not.toHaveProperty("loss");
    expect(v.commands[0]).not.toHaveProperty("returns");
    retire(a);
    expect(view(a).settlement?.actual.treasury).toBe(a.treasury);
  });
  it("invisible state changes do not change visible controls", () => {
    const a = newGame(5),
      b = structuredClone(a);
    b.treasury = 0;
    b.regions[0].grain = 0;
    b.regions[0].unrest = 0.99;
    b.people[0].rent = 0.9;
    expect(view(b)).toEqual(view(a));
  });
  it("capital loss moves the court when a continuing polity exists", () => {
    const a = newGame(12);
    settlePetitions(a);
    a.regions[0].control = false;
    simulate(a, 30);
    expect(a.capital).not.toBe("capital");
    expect(a.ended).toBeNull();
  });
  it("complete territorial loss ends dynasty, low court authority alone does not", () => {
    const a = newGame(14);
    settlePetitions(a);
    a.court.authority = 0.18;
    simulate(a, 30);
    expect(a.ended).toBeNull();
    a.regions.forEach((r) => {
      r.control = false;
    });
    simulate(a, 60);
    expect(a.ended).toBe("defeat");
  });
  it("succession preserves the world and archives", () => {
    const a = newGame(23);
    settlePetitions(a);
    a.ruler.ends = 1;
    advance(a, 1);
    expect(a.ruler.generation).toBe(2);
    expect(a.treasury).toBe(480);
    expect(a.reports[0].title).toBe("宁夏军饷未至");
  });
  it("rejects damaged and incompatible saves without replacing state", () => {
    const a = newGame(3);
    expect(() => decode(encode(a).replace("ming-save", "other"))).toThrow();
    expect(() => decode(encode(a).replace("checksum", "bad"))).toThrow();
    expect(() => decode("{}")).toThrow();
    expect(() => decode("broken")).toThrow();
  });
  it("allows leave-in-palace even with twelve commands awaiting reports", () => {
    const a = newGame(4);
    for (let i = 0; i < 12; i++) issue(a, "school", "south");
    expect(issue(a, "observe", "north", a.reports[0].id)).toBe(true);
  });
  it("three seeded campaigns reach a causal ending without numerical explosion", () => {
    const results = [];
    for (const seed of [17, 29, 41]) {
      const a = newGame(seed);
      simulate(a, 108000);
      expect(["victory", "defeat"]).toContain(a.ended);
      expect(a.ruler.generation).toBeGreaterThan(0);
      expect(Math.abs(invariants(a).silverError)).toBeLessThan(1e-5);
      expect(Math.abs(invariants(a).grainError)).toBeLessThan(1e-4);
      expect(encode(a).length).toBeLessThan(5_000_000);
      expect(() => decode(encode(a))).not.toThrow();
      results.push({
        seed,
        ending: a.ended,
        year: 1582 + a.day / 360,
        people: a.regions.reduce((s, r) => s + r.population, 0),
        treasury: a.treasury,
        grain: a.regions.reduce((s, r) => s + r.grain, 0),
        deaths: a.deaths,
        commands: a.commands.length,
        reports: a.reports.length,
      });
    }
    console.log("LONG_CAMPAIGNS", JSON.stringify(results));
  }, 30000);
  it("opens the victory recap exactly at the 300-year boundary", () => {
    const a = newGame(1);
    settlePetitions(a);
    a.day = 107999;
    a.ruler.ends = 108100;
    advance(a, 1);
    expect(a.day).toBe(108000);
    expect(a.ended).toBe("victory");
    expect(view(a).settlement).not.toBeNull();
  });
});
