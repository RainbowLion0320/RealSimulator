import { describe, it, expect } from "vitest";
import { newGame, issue, ask, advance, view } from "../src/sim/engine";
import { encode, decode } from "../src/sim/save";
import {
  tutorialEvent,
  tutorialStep,
  tutorialAllows,
  syncTutorial,
  skipTutorial,
} from "../src/sim/tutorial";

describe("guided opening", () => {
  it.each(["pay", "audit", "defend", "observe"] as const)(
    "finishes with %s and resumes each step without leaking truth",
    (choice) => {
      let g = newGame(82);
      const checkpoint = () => {
        g = decode(encode(g));
      };
      expect(tutorialAllows(tutorialStep(g), "people")).toBe(false);
      tutorialEvent(g, "begin");
      checkpoint();
      tutorialEvent(g, "read");
      checkpoint();
      tutorialEvent(g, "decided"); // Opening the menu alone does not finish a decision.
      expect(tutorialStep(g)).toBe("decision");
      expect(issue(g, choice, "north", g.tutorial!.firstReportId, "shen")).toBe(
        true,
      );
      tutorialEvent(g, "decided");
      checkpoint();
      expect(tutorialAllows(tutorialStep(g), "orders")).toBe(true);
      expect(tutorialAllows(tutorialStep(g), "people")).toBe(false);
      tutorialEvent(g, "orders");
      checkpoint();
      expect(ask(g, "qi", "north", "military")).toBe(true);
      tutorialEvent(g, "asked", g.nextId - 1);
      checkpoint();
      syncTutorial(g);
      expect(tutorialStep(g)).toBe("wait"); // A queued report is not visible evidence.
      const before = view(g);
      expect(before.reports.some((r) => r.id === g.tutorial!.replyId)).toBe(
        false,
      );
      advance(g, 1);
      syncTutorial(g);
      checkpoint();
      expect(tutorialStep(g)).toBe("reply");
      expect(g.day).toBe(1);
      expect(view(g).settlement).toBeNull();
      tutorialEvent(g, "reply");
      checkpoint();
      expect(tutorialAllows(tutorialStep(g), "archive")).toBe(true);
      expect(tutorialAllows(tutorialStep(g), "map")).toBe(false);
      tutorialEvent(g, "archive");
      checkpoint();
      tutorialEvent(g, "map");
      checkpoint();
      expect(tutorialStep(g)).toBe("done");
      expect(tutorialAllows(tutorialStep(g), "map")).toBe(true);
      expect(g.commands.length).toBe(choice === "observe" ? 0 : 1);
      // Following the same orders without the guide produces the same world.
      const ordinary = newGame(82);
      issue(ordinary, choice, "north", 1, "shen");
      ask(ordinary, "qi", "north", "military");
      advance(ordinary, 1);
      expect(view(g)).toEqual(view(ordinary));
      expect(g.rng).toBe(ordinary.rng);
    },
  );
  it("preserves legacy campaigns, skip progress, and rejects broken waiting saves", () => {
    const g = newGame(10);
    delete g.tutorial;
    expect(tutorialStep(decode(encode(g)))).toBe("done");
    const fresh = newGame(11);
    skipTutorial(fresh);
    expect(tutorialStep(decode(encode(fresh)))).toBe("done");
    fresh.tutorial!.step = "wait";
    fresh.tutorial!.replyId = 999999;
    expect(() => decode(encode(fresh))).toThrow("召对记录");
  });
});
