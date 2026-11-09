import { createContext, useCallback, useContext } from 'react'
import type { TeacherSettings } from './data/types'
import type { ChallengeCatalog } from './lib/challenges'
import type { Progress, Session } from './lib/progress'
import { makeResult, type ChallengeType } from './lib/scoring'
import type { SoundName } from './lib/audio'

export type Screen =
  | { name: 'opening' }
  | { name: 'register' }
  | { name: 'tutorial' }
  | { name: 'map' }
  | { name: 'star'; unitId: string }
  | { name: 'orbit'; orbitId: string }
  | { name: 'final' }
  | { name: 'results' }
  | { name: 'certificate' }
  | { name: 'teacher' }

export interface GameCtx {
  settings: TeacherSettings
  catalog: ChallengeCatalog
  session: Session | null
  setProgress: (fn: (p: Progress) => Progress) => void
  sfx: (s: SoundName) => void
  go: (s: Screen) => void
}

export const GameContext = createContext<GameCtx | null>(null)

export function useGame(): GameCtx {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('GameContext tiada')
  return ctx
}

export function useSession() {
  const g = useGame()
  if (!g.session) throw new Error('Tiada sesi murid')
  return { ...g, session: g.session, progress: g.session.progress }
}

export function challengeKey(type: ChallengeType, id: string): string {
  return `${type}:${id}`
}

/** Pengurusan percubaan berjalan + rekod keputusan bagi satu cabaran. */
export function useAttempts(type: ChallengeType, id: string) {
  const { session, setProgress } = useSession()
  const key = challengeKey(type, id)
  const pending = session.progress.pending?.[key] ?? { attempts: 0, hints: 0 }

  const addWrong = useCallback(() => {
    setProgress((p) => {
      const cur = p.pending?.[key] ?? { attempts: 0, hints: 0 }
      return { ...p, pending: { ...(p.pending ?? {}), [key]: { ...cur, attempts: cur.attempts + 1 } } }
    })
  }, [key, setProgress])

  const addHint = useCallback(() => {
    setProgress((p) => {
      const cur = p.pending?.[key] ?? { attempts: 0, hints: 0 }
      return { ...p, pending: { ...(p.pending ?? {}), [key]: { ...cur, hints: cur.hints + 1 } } }
    })
  }, [key, setProgress])

  /** Dipanggil apabila jawapan betul: percubaan = salah sebelumnya + 1 */
  const complete = useCallback(() => {
    setProgress((p) => {
      const cur = p.pending?.[key] ?? { attempts: 0, hints: 0 }
      const result = makeResult(type, cur.attempts + 1, cur.hints)
      const pendingNext = { ...(p.pending ?? {}) }
      delete pendingNext[key]
      const next: Progress = { ...p, pending: pendingNext }
      if (type === 'lafaz') next.lafaz = { ...p.lafaz, [id]: result }
      else if (type === 'meaning') next.meaning = { ...p.meaning, [id]: result }
      else if (type === 'orbit') next.orbit = { ...p.orbit, [id]: result }
      else {
        next.final = result
        next.completedAt = result.completedAt
      }
      return next
    })
  }, [key, type, id, setProgress])

  return { wrong: pending.attempts, hints: pending.hints, addWrong, addHint, complete }
}
