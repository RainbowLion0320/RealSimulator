import { it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import {
  advance,
  issue,
  newGame,
  pending,
  invariants,
  view,
} from "../src/sim/engine";
import { encode, pack, unpack } from "../src/sim/save";
import type { Policy } from "../src/sim/types";
it("compares neglect, measured government and repeated costly offensives", () => {
  const results = [];
  for (const seed of [17, 29, 41])
    for (const mode of ["neglect", "measured", "offensive"]) {
      const g = newGame(seed);
      let lastYear = -1,
        guard = 0;
      while (g.day < 108000 && !g.ended) {
        const year = Math.floor(g.day / 360),
          publicView = view(g);
        const reported = publicView.lastSilver?.claimSilver ?? 0;
        if (year !== lastYear) {
          lastYear = year;
          if (mode === "measured" && year % 8 === 0 && reported > 100)
            issue(g, "tax", "south");
          if (mode === "measured" && year % 8 === 1 && reported > 150)
            issue(g, "school", "south");
          if (mode === "offensive") issue(g, "campaign", "border");
        }
        for (const r of pending(g)) {
          let pick: Policy = "observe";
          if (mode === "measured") {
            if (r.domain === "外交") pick = "trade";
            else if (r.domain === "边务")
              pick = r.options.includes("peace") ? "peace" : "pay";
            else if (r.domain === "工务" && reported > 120)
              pick = year % 3 === 0 ? "irrigation" : "observe";
            else if (r.domain === "民生" && reported > 70) pick = "relief";
            else if (r.title.includes("承统")) pick = "recover";
          }
          if (mode === "offensive" && r.options.includes("campaign"))
            pick = "campaign";
          if (!r.options.includes(pick)) pick = "observe";
          if (!issue(g, pick, r.region, r.id))
            issue(g, "observe", r.region, r.id);
        }
        expect(advance(g, 30)).toBeGreaterThan(0);
        if (++guard > 15000) throw new Error("simulation stalled");
      }
      const conservation = invariants(g);
      expect(Math.abs(conservation.silverError)).toBeLessThan(1e-5);
      expect(Math.abs(conservation.grainError)).toBeLessThan(1e-4);
      const compressed = pack(g);
      expect(compressed.length * 4 * 2).toBeLessThan(5_000_000);
      expect(unpack(compressed)).toEqual(g);
      results.push({
        seed,
        mode,
        ending: g.ended,
        years: g.day / 360,
        populationMillion: g.regions.reduce((s, r) => s + r.population, 0),
        treasuryWan: g.treasury,
        disasterWarDeathsMillion: g.deaths,
        controlledRegions: g.regions.filter((r) => r.control).length,
        commands: g.commands.length,
        saveCharacters: encode(g).length,
        compressedCharacters: compressed.length,
        ...conservation,
      });
    }
  mkdirSync("output/qa", { recursive: true });
  writeFileSync("output/qa/balance.json", JSON.stringify(results, null, 2));
  expect(results.some((r) => r.ending === "victory")).toBe(true);
  expect(
    results.some(
      (r) => r.ending === "defeat" || r.disasterWarDeathsMillion > 30,
    ),
  ).toBe(true);
}, 120000);
