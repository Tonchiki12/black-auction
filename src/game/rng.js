// RNG contract: a synchronous function returning a finite number in [0, 1).
export function defaultRng() {
  return Math.random();
}

export function drawRandom(rng) {
  if (typeof rng !== 'function') throw new TypeError('RNG must be a function');
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('RNG must return a number in [0, 1)');
  }
  return value;
}

export function shuffle(items, rng) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(drawRandom(rng) * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
