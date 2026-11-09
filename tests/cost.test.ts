import { expect, it } from "vitest";

import { trace } from "../src/vitest";
import { header, makeProject, removeProject, runVitest } from "./support/run";

const median = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// Opt-in: wall-clock varies with host load, so this runs only when asked for.
it.skipIf(process.env.QUIRE_PERF_TESTS !== "1")(
  "TC-010 cost: 500 tagged tests add under 5% median wall-clock time",
  async () => {
    trace("FR-001-AC-10", "TC-010");
    let body = header;
    for (let i = 0; i < 500; i++) {
      body += `it("t${i}", () => { trace("P-${i}"); let x = 0; for (let k = 0; k < 2e5; k++) x += k; expect(x).toBeGreaterThan(0); });\n`;
    }
    const dir = makeProject({ "a.test.ts": body });
    try {
      const time = async (emit: "1" | undefined) => {
        const start = performance.now();
        const run = await runVitest(dir, { emit });
        expect(run.code).toBe(0);
        return performance.now() - start;
      };
      await time(undefined);
      // Interleaved pairs, so load that drifts hits both sides alike.
      const ratios: number[] = [];
      for (let i = 0; i < 11; i++) {
        const off = await time(undefined);
        const on = await time("1");
        ratios.push(on / off);
      }
      expect(median(ratios)).toBeLessThan(1.05);
    } finally {
      removeProject(dir);
    }
  },
  300_000,
);
