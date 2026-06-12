import { describe, expect, it } from "vitest";
import {
  clearHighScores,
  getHighScoresForDelay,
  recordHighScore,
} from "../html5/src/js/app/leaderboard.js";

const createStorage = () => {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
};

describe("leaderboard persistence", () => {
  it("stores and returns only scores comparable by delay range", () => {
    const storage = createStorage();
    recordHighScore(storage, { score: 200, lines: 4, tickMs: 300 }, 1_000);
    recordHighScore(storage, { score: 400, lines: 8, tickMs: 350 }, 2_000);
    recordHighScore(storage, { score: 900, lines: 15, tickMs: 450 }, 3_000);

    const fastRange = getHighScoresForDelay(storage, 320, 4_000);
    const slowerRange = getHighScoresForDelay(storage, 470, 4_000);

    expect(fastRange.rangeLabel).toBe("300-399 ms");
    expect(fastRange.entries).toHaveLength(2);
    expect(fastRange.entries[0].score).toBe(400);
    expect(fastRange.entries[1].score).toBe(200);

    expect(slowerRange.rangeLabel).toBe("400-499 ms");
    expect(slowerRange.entries).toHaveLength(1);
    expect(slowerRange.entries[0].score).toBe(900);
  });

  it("drops entries older than one month", () => {
    const storage = createStorage();
    const now = 100 * 24 * 60 * 60 * 1000;
    const old = now - 31 * 24 * 60 * 60 * 1000;

    recordHighScore(storage, { score: 100, lines: 1, tickMs: 300 }, old);
    recordHighScore(storage, { score: 300, lines: 6, tickMs: 300 }, now);

    const range = getHighScoresForDelay(storage, 300, now);
    expect(range.entries).toHaveLength(1);
    expect(range.entries[0].score).toBe(300);
  });

  it("clears all scores manually", () => {
    const storage = createStorage();
    recordHighScore(storage, { score: 250, lines: 5, tickMs: 300 }, 10_000);
    clearHighScores(storage);

    const range = getHighScoresForDelay(storage, 300, 20_000);
    expect(range.entries).toHaveLength(0);
  });
});
