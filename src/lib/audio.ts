/**
 * Kesan bunyi disintesis menggunakan Web Audio API (tiada fail audio luaran).
 * Audio bacaan Arab TIDAK disertakan — hanya digunakan jika rakaman sah guru tersedia.
 */
export type SoundName = 'star' | 'correct' | 'hint' | 'orbit' | 'click' | 'victory'

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean): void {
  muted = m
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain = 0.12) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + start)
  g.gain.setValueAtTime(0.0001, c.currentTime + start)
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur)
  osc.connect(g).connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + dur + 0.05)
}

const PATTERNS: Record<SoundName, [number, number, number, OscillatorType][]> = {
  click: [[660, 0, 0.08, 'sine']],
  star: [
    [880, 0, 0.25, 'sine'],
    [1320, 0.08, 0.35, 'sine'],
    [1760, 0.16, 0.5, 'triangle'],
  ],
  correct: [
    [523.25, 0, 0.18, 'triangle'],
    [659.25, 0.1, 0.18, 'triangle'],
    [783.99, 0.2, 0.3, 'triangle'],
  ],
  hint: [
    [440, 0, 0.18, 'sine'],
    [392, 0.15, 0.25, 'sine'],
  ],
  orbit: [
    [392, 0, 0.3, 'triangle'],
    [523.25, 0.12, 0.3, 'triangle'],
    [659.25, 0.24, 0.3, 'triangle'],
    [1046.5, 0.36, 0.6, 'sine'],
  ],
  victory: [
    [523.25, 0, 0.25, 'triangle'],
    [659.25, 0.15, 0.25, 'triangle'],
    [783.99, 0.3, 0.25, 'triangle'],
    [1046.5, 0.45, 0.5, 'triangle'],
    [1318.5, 0.65, 0.8, 'sine'],
  ],
}

export function play(name: SoundName): void {
  if (muted) return
  try {
    const c = getCtx()
    if (!c) return
    for (const [f, s, d, t] of PATTERNS[name]) tone(c, f, s, d, t)
  } catch {
    /* audio tidak disokong */
  }
}
