import type { OrbitDef, UnitData } from '../data/types'
import { buildOrbits } from '../data/units'
import { shuffle } from './random'

export interface Token {
  /** ID unik token — perkataan berulang tetap mempunyai ID berbeza */
  id: string
  text: string
}

export function splitWords(arabic: string): string[] {
  return arabic.trim().split(/\s+/u).filter(Boolean)
}

export function tokensOf(unit: UnitData): Token[] {
  return splitWords(unit.arabic).map((text, i) => ({ id: `${unit.id}-w${i}`, text }))
}

export interface BlankChallenge {
  kind: 'blank'
  unitId: string
  before: string[]
  after: string[]
  answer: string
  options: string[]
}

export interface OrderChallenge {
  kind: 'order'
  unitId: string
  tokens: Token[]
}

export type LafazChallenge = BlankChallenge | OrderChallenge

export function buildLafazChallenge(unit: UnitData, rng: () => number = Math.random): LafazChallenge {
  if (unit.lafazMode === 'order') {
    return { kind: 'order', unitId: unit.id, tokens: tokensOf(unit) }
  }
  const words = splitWords(unit.arabic)
  const answer = words[unit.blankIndex]
  return {
    kind: 'blank',
    unitId: unit.id,
    before: words.slice(0, unit.blankIndex),
    after: words.slice(unit.blankIndex + 1),
    answer,
    options: shuffle([answer, ...unit.lafazDistractors.slice(0, 3)], rng),
  }
}

export interface MeaningChallenge {
  unitId: string
  question: string
  answer: string
  options: string[]
}

export const MEANING_QUESTION = 'Apakah maksud baris bacaan ini?'

export function buildMeaningChallenge(unit: UnitData, rng: () => number = Math.random): MeaningChallenge {
  return {
    unitId: unit.id,
    question: MEANING_QUESTION,
    answer: unit.meaning,
    options: shuffle([unit.meaning, ...unit.meaningDistractors.slice(0, 3)], rng),
  }
}

/**
 * Semak susunan berdasarkan ID unik.
 * - Setiap ID mesti digunakan tepat sekali (tiada ID berulang / tertinggal).
 * - Kedudukan dikira betul jika ID sama dengan jangkaan, ATAU jika kad itu
 *   mempunyai lafaz yang sama tepat (cth. unit 11 & 14) — kerana murid tidak
 *   dapat membezakan dua kad yang lafaznya serupa.
 */
export interface SequenceCheck {
  complete: boolean
  correct: boolean
  /** true/false bagi setiap slot; null jika kosong */
  slots: (boolean | null)[]
  correctCount: number
}

export function checkSequence(
  placed: (string | null)[],
  expected: string[],
  textOf: (id: string) => string,
): SequenceCheck {
  const used = placed.filter((p): p is string => p !== null)
  const uniqueOk = new Set(used).size === used.length && used.every((id) => expected.includes(id))
  const slots = expected.map((expId, i) => {
    const p = placed[i] ?? null
    if (p === null) return null
    return p === expId || textOf(p) === textOf(expId)
  })
  const complete = placed.length === expected.length && placed.every((p) => p !== null)
  const correctCount = slots.filter((s) => s === true).length
  return {
    complete,
    correct: complete && uniqueOk && correctCount === expected.length,
    slots,
    correctCount,
  }
}

export interface ChallengeCatalog {
  units: UnitData[]
  orbits: OrbitDef[]
  lafazCount: number
  meaningCount: number
  orbitCount: number
  finalCount: number
  total: number
}

export function buildCatalog(units: UnitData[]): ChallengeCatalog {
  const sorted = [...units].sort((a, b) => a.order - b.order)
  const orbits = buildOrbits(sorted)
  return {
    units: sorted,
    orbits,
    lafazCount: sorted.length,
    meaningCount: sorted.length,
    orbitCount: orbits.length,
    finalCount: 1,
    total: sorted.length * 2 + orbits.length + 1,
  }
}

/** Validasi data unit (memastikan bank soalan lengkap & konsisten). */
export function validateUnits(units: UnitData[]): string[] {
  const errors: string[] = []
  if (units.length !== 15) errors.push(`Mesti ada 15 unit (kini ${units.length}).`)
  const ids = new Set<string>()
  units.forEach((u, idx) => {
    const label = `Unit ${u.order || idx + 1}`
    if (!u.id?.trim()) errors.push(`${label}: ID kosong.`)
    if (ids.has(u.id)) errors.push(`${label}: ID "${u.id}" berulang.`)
    ids.add(u.id)
    if (!u.arabic?.trim()) errors.push(`${label}: teks Arab kosong.`)
    if (!u.meaning?.trim()) errors.push(`${label}: maksud kosong.`)
    const words = splitWords(u.arabic ?? '')
    if (u.lafazMode === 'blank') {
      if (!(u.blankIndex >= 0 && u.blankIndex < words.length))
        errors.push(`${label}: indeks perkataan kosong di luar julat.`)
      const ans = words[u.blankIndex]
      const opts = [ans, ...(u.lafazDistractors ?? [])]
      if ((u.lafazDistractors ?? []).filter((d) => d.trim()).length < 3)
        errors.push(`${label}: perlu 3 distraktor lafaz.`)
      if (new Set(opts).size !== opts.length) errors.push(`${label}: pilihan lafaz berulang.`)
    } else if (u.lafazMode === 'order') {
      if (words.length < 3) errors.push(`${label}: mod susun perlu sekurang-kurangnya 3 perkataan.`)
    } else {
      errors.push(`${label}: mod lafaz tidak sah.`)
    }
    const mopts = [u.meaning, ...(u.meaningDistractors ?? [])].map((m) => m?.trim())
    if ((u.meaningDistractors ?? []).filter((d) => d.trim()).length < 3)
      errors.push(`${label}: perlu 3 distraktor maksud.`)
    if (new Set(mopts).size !== mopts.length) errors.push(`${label}: pilihan maksud berulang.`)
  })
  const orders = units.map((u) => u.order).sort((a, b) => a - b)
  if (orders.join(',') !== Array.from({ length: units.length }, (_, i) => i + 1).join(','))
    errors.push('Nombor tertib unit mesti 1 hingga 15 tanpa ulangan.')
  return errors
}
