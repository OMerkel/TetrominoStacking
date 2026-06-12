export const nextSeed = (seed) => (1664525 * seed + 1013904223) >>> 0;

export const nextFloat = (seed) => {
  const seedValue = nextSeed(seed);
  return {
    seed: seedValue,
    value: seedValue / 0x100000000,
  };
};

export const nextInt = (seed, maxExclusive) => {
  const { seed: newSeed, value } = nextFloat(seed);
  return {
    seed: newSeed,
    value: Math.floor(value * maxExclusive),
  };
};

export const pickFromList = (seed, list) => {
  const { seed: newSeed, value } = nextInt(seed, list.length);
  return {
    seed: newSeed,
    value: list[value],
  };
};
