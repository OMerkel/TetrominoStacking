import { describe, expect, it } from "vitest";
import {
  nextFloat,
  nextInt,
  nextSeed,
  pickFromList,
} from "../html5/src/js/core/random.js";

describe("random utilities", () => {
  it("creates deterministic seed sequence", () => {
    expect(nextSeed(1)).toBe(1015568748);
    expect(nextSeed(1015568748)).toBe(1586005467);
  });

  it("returns float in [0, 1)", () => {
    const result = nextFloat(1);
    expect(result.seed).toBe(1015568748);
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThan(1);
  });

  it("returns int in range", () => {
    const result = nextInt(2, 7);
    expect(result.seed).toBeTypeOf("number");
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThan(7);
  });

  it("picks list item from deterministic stream", () => {
    const list = ["A", "B", "C", "D"];
    const first = pickFromList(123, list);
    const second = pickFromList(123, list);
    expect(first).toEqual(second);
    expect(list).toContain(first.value);
  });
});
