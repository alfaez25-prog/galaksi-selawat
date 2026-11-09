/** Fisher–Yates shuffle (tidak mengubah array asal). */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Shuffle yang dijamin tidak sama dengan susunan asal (jika boleh). */
export function shuffleNotIdentity<T>(
  arr: readonly T[],
  keyOf: (t: T) => string,
  rng: () => number = Math.random,
): T[] {
  if (arr.length < 2) return [...arr]
  const original = arr.map(keyOf).join('|')
  const distinct = new Set(arr.map(keyOf)).size > 1
  for (let tries = 0; tries < 20; tries++) {
    const s = shuffle(arr, rng)
    if (!distinct || s.map(keyOf).join('|') !== original) return s
  }
  const s = [...arr]
  s.push(s.shift() as T)
  return s
}

/** RNG berbenih ringkas (mulberry32) untuk ujian. */
export function seeded(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
