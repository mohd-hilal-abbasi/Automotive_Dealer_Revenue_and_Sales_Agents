import crypto from 'node:crypto';

/** Deterministic pseudo-random number generator from a string key. */
export function seededRandom01(key) {
  const hash = crypto.createHash('sha256').update(String(key)).digest();
  // Use first 8 bytes to build a number in [0,1)
  const n = hash.readBigUInt64BE(0);
  const max = 2n ** 64n;
  return Number(n) / Number(max);
}

export function bernoulli(prob01, seedKey) {
  const r = seededRandom01(seedKey);
  return r < prob01;
}

