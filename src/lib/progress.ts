import type { ChallengeCatalog } from './challenges'
import { maxXp, type ChallengeResult } from './scoring'

export interface Student {
  name: string
  className: string
  avatar: string
}

export interface Progress {
  tutorialDone: boolean
  lafaz: Record<string, ChallengeResult>
  meaning: Record<string, ChallengeResult>
  orbit: Record<string, ChallengeResult>
  final: ChallengeResult | null
  completedAt: string | null
  /** Percubaan yang sedang berjalan (supaya muat semula halaman tidak memadam percubaan salah) */
  pending: Record<string, { attempts: number; hints: number }>
}

export interface Session {
  key: string
  student: Student
  startedAt: string
  progress: Progress
}

export function emptyProgress(): Progress {
  return { tutorialDone: false, lafaz: {}, meaning: {}, orbit: {}, final: null, completedAt: null, pending: {} }
}

export function totalXp(p: Progress): number {
  const sum = (r: Record<string, ChallengeResult>) => Object.values(r).reduce((s, x) => s + x.xp, 0)
  return sum(p.lafaz) + sum(p.meaning) + sum(p.orbit) + (p.final?.xp ?? 0)
}

export function isStarDone(p: Progress, unitId: string): boolean {
  return Boolean(p.lafaz[unitId] && p.meaning[unitId])
}

/** Bintang dibuka mengikut tertib — tiada unit boleh dilangkau. */
export function isStarUnlocked(p: Progress, cat: ChallengeCatalog, unitId: string): boolean {
  const idx = cat.units.findIndex((u) => u.id === unitId)
  if (idx < 0) return false
  if (!p.tutorialDone) return false
  return cat.units.slice(0, idx).every((u) => isStarDone(p, u.id))
}

export function isOrbitUnlocked(p: Progress, cat: ChallengeCatalog, orbitId: string): boolean {
  const orbit = cat.orbits.find((o) => o.id === orbitId)
  return Boolean(orbit && orbit.unitIds.every((id) => isStarDone(p, id)))
}

export function isFinalUnlocked(p: Progress, cat: ChallengeCatalog): boolean {
  return (
    cat.units.every((u) => isStarDone(p, u.id)) && cat.orbits.every((o) => Boolean(p.orbit[o.id]))
  )
}

export function completedCount(p: Progress, cat: ChallengeCatalog): number {
  return (
    cat.units.filter((u) => p.lafaz[u.id]).length +
    cat.units.filter((u) => p.meaning[u.id]).length +
    cat.orbits.filter((o) => p.orbit[o.id]).length +
    (p.final ? 1 : 0)
  )
}

/** Semua cabaran (34) mesti selesai sebelum keputusan & sijil dibuka. */
export function isGameComplete(p: Progress, cat: ChallengeCatalog): boolean {
  return completedCount(p, cat) === cat.total && isFinalUnlocked(p, cat) && p.final !== null
}

export const canGenerateCertificate = isGameComplete

export interface MasteryBreakdown {
  lafaz: { firstTry: number; total: number }
  meaning: { firstTry: number; total: number }
  orbit: { firstTry: number; total: number }
  final: { firstTry: number; total: number }
  firstTry: number
  total: number
  percent: number
}

export function mastery(p: Progress, cat: ChallengeCatalog): MasteryBreakdown {
  const count = (ids: string[], r: Record<string, ChallengeResult>) =>
    ids.filter((id) => r[id]?.firstTry).length
  const unitIds = cat.units.map((u) => u.id)
  const orbitIds = cat.orbits.map((o) => o.id)
  const b = {
    lafaz: { firstTry: count(unitIds, p.lafaz), total: unitIds.length },
    meaning: { firstTry: count(unitIds, p.meaning), total: unitIds.length },
    orbit: { firstTry: count(orbitIds, p.orbit), total: orbitIds.length },
    final: { firstTry: p.final?.firstTry ? 1 : 0, total: 1 },
  }
  const firstTry = b.lafaz.firstTry + b.meaning.firstTry + b.orbit.firstTry + b.final.firstTry
  const total = cat.total
  return { ...b, firstTry, total, percent: total ? Math.round((firstTry / total) * 1000) / 10 : 0 }
}

export function maxXpFor(cat: ChallengeCatalog): number {
  return maxXp(cat.units.length, cat.orbits.length)
}

export interface Badge {
  id: 'emas' | 'perak' | 'gangsa'
  label: string
  description: string
}

export function badgeFor(percent: number): Badge {
  if (percent >= 85)
    return { id: 'emas', label: 'Lencana Emas — Bintang Kejora', description: 'Penguasaan cemerlang' }
  if (percent >= 60)
    return { id: 'perak', label: 'Lencana Perak — Bintang Purnama', description: 'Penguasaan baik' }
  return { id: 'gangsa', label: 'Lencana Gangsa — Penjelajah Gigih', description: 'Teruskan berlatih' }
}
