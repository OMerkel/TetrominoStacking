const LEADERBOARD_STORAGE_KEY = "tetromino.leaderboard.v1";
const BUCKET_SIZE_MS = 100;
const MAX_ENTRIES_PER_BUCKET = 10;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createEmptyLeaderboard = () => ({
  buckets: {},
});

const bucketForDelay = (tickMs) => {
  const normalized = Math.max(0, safeNumber(tickMs));
  const start = Math.floor(normalized / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
  const end = start + BUCKET_SIZE_MS - 1;
  return {
    key: `${start}-${end}`,
    start,
    end,
  };
};

const pruneExpired = (leaderboard, nowMs) => {
  const minTimestamp = nowMs - MONTH_MS;
  const nextBuckets = {};

  for (const [bucketKey, entries] of Object.entries(
    leaderboard.buckets ?? {},
  )) {
    const filtered = (entries ?? []).filter(
      (entry) => safeNumber(entry.at, 0) >= minTimestamp,
    );
    if (filtered.length > 0) {
      nextBuckets[bucketKey] = filtered;
    }
  }

  return { buckets: nextBuckets };
};

const parseLeaderboard = (rawValue) => {
  if (!rawValue) {
    return createEmptyLeaderboard();
  }
  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") {
      return createEmptyLeaderboard();
    }
    if (!parsed.buckets || typeof parsed.buckets !== "object") {
      return createEmptyLeaderboard();
    }
    return { buckets: parsed.buckets };
  } catch {
    return createEmptyLeaderboard();
  }
};

const readLeaderboard = (storage, nowMs) => {
  try {
    const raw = storage.getItem(LEADERBOARD_STORAGE_KEY);
    return pruneExpired(parseLeaderboard(raw), nowMs);
  } catch {
    return createEmptyLeaderboard();
  }
};

const writeLeaderboard = (storage, leaderboard) => {
  try {
    storage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
  } catch {
    // Ignore persistence failures (private mode, quota exceeded, blocked storage).
  }
};

export const formatDelayRange = (tickMs) => {
  const { start, end } = bucketForDelay(tickMs);
  return `${start}-${end} ms`;
};

export const recordHighScore = (
  storage,
  { score, lines, tickMs },
  nowMs = Date.now(),
) => {
  const leaderboard = readLeaderboard(storage, nowMs);
  const bucket = bucketForDelay(tickMs);
  const nextEntry = {
    score: safeNumber(score, 0),
    lines: safeNumber(lines, 0),
    tickMs: safeNumber(tickMs, 0),
    at: nowMs,
  };

  const currentEntries = leaderboard.buckets[bucket.key] ?? [];
  const nextEntries = [...currentEntries, nextEntry]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.lines !== a.lines) {
        return b.lines - a.lines;
      }
      return b.at - a.at;
    })
    .slice(0, MAX_ENTRIES_PER_BUCKET);

  const nextLeaderboard = {
    ...leaderboard,
    buckets: {
      ...leaderboard.buckets,
      [bucket.key]: nextEntries,
    },
  };

  writeLeaderboard(storage, nextLeaderboard);
  return nextEntries;
};

export const getHighScoresForDelay = (storage, tickMs, nowMs = Date.now()) => {
  const leaderboard = readLeaderboard(storage, nowMs);
  const bucket = bucketForDelay(tickMs);
  writeLeaderboard(storage, leaderboard);
  return {
    rangeLabel: `${bucket.start}-${bucket.end} ms`,
    entries: leaderboard.buckets[bucket.key] ?? [],
  };
};

export const clearHighScores = (storage) => {
  try {
    storage.removeItem(LEADERBOARD_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};
