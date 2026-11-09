/**
 * PERATURAN XP (jelas & boleh dijelaskan kepada murid)
 *
 * Lafaz / Maksud (asas 50 XP):
 *   betul pada percubaan 1 = 50, 2 = 30, 3 = 15, 4 dan seterusnya = 5
 * Orbit (asas 100 XP):
 *   betul pada semakan 1 = 100, 2 = 70, 3 = 40, 4+ = 20; setiap petunjuk −10 (minimum 10)
 * Final Galaxy (asas 200 XP):
 *   betul pada semakan 1 = 200, 2 = 150, 3 = 100, 4+ = 50; setiap petunjuk −20 (minimum 20)
 *
 * Peratus penguasaan dikira BERASINGAN daripada XP: bilangan cabaran yang
 * betul pada percubaan pertama tanpa petunjuk ÷ jumlah cabaran × 100.
 */

export type ChallengeType = 'lafaz' | 'meaning' | 'orbit' | 'final'

export const BASE_XP: Record<ChallengeType, number> = {
  lafaz: 50,
  meaning: 50,
  orbit: 100,
  final: 200,
}

const ATTEMPT_FRACTION: Record<ChallengeType, number[]> = {
  lafaz: [1, 0.6, 0.3, 0.1],
  meaning: [1, 0.6, 0.3, 0.1],
  orbit: [1, 0.7, 0.4, 0.2],
  final: [1, 0.75, 0.5, 0.25],
}

const HINT_PENALTY_FRACTION = 0.1
const MIN_FRACTION = 0.1

export function xpFor(type: ChallengeType, attempts: number, hints = 0): number {
  const base = BASE_XP[type]
  const table = ATTEMPT_FRACTION[type]
  const idx = Math.min(Math.max(attempts, 1), table.length) - 1
  let xp = base * table[idx] - hints * base * HINT_PENALTY_FRACTION
  xp = Math.max(xp, base * MIN_FRACTION)
  return Math.round(xp)
}

export const XP_RULES_TEXT = [
  'Lafaz & Maksud: 50 XP (percubaan 1), 30 XP (ke-2), 15 XP (ke-3), 5 XP (ke-4 dan seterusnya).',
  'Orbit: 100 XP (semakan 1), 70 XP (ke-2), 40 XP (ke-3), 20 XP (ke-4+). Setiap petunjuk −10 XP.',
  'Final Galaxy: 200 XP (semakan 1), 150 XP (ke-2), 100 XP (ke-3), 50 XP (ke-4+). Setiap petunjuk −20 XP.',
  'Peratus penguasaan = cabaran betul pada percubaan pertama tanpa petunjuk ÷ semua cabaran.',
]

export interface ChallengeResult {
  attempts: number
  hints: number
  xp: number
  firstTry: boolean
  completedAt: string
}

export function makeResult(type: ChallengeType, attempts: number, hints = 0): ChallengeResult {
  return {
    attempts,
    hints,
    xp: xpFor(type, attempts, hints),
    firstTry: attempts === 1 && hints === 0,
    completedAt: new Date().toISOString(),
  }
}

export function maxXp(unitCount: number, orbitCount: number): number {
  return unitCount * (BASE_XP.lafaz + BASE_XP.meaning) + orbitCount * BASE_XP.orbit + BASE_XP.final
}
