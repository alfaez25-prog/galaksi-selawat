import { emptyProgress, type Session, type Student } from './progress'

const PREFIX = 'galaksi-selawat:v1:'
export const KEYS = {
  active: PREFIX + 'active-session',
  sessions: PREFIX + 'sessions',
  muted: PREFIX + 'muted',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storan penuh atau disekat — permainan tetap berjalan */
  }
}

export function normalise(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

/** Kunci sesi unik untuk setiap murid (nama + kelas) supaya keputusan tidak bercampur. */
export function studentKey(name: string, className: string): string {
  return `${normalise(name).toLocaleUpperCase('ms')}|${normalise(className).toLocaleUpperCase('ms')}`
}

type SessionMap = Record<string, Session>

export function loadSessions(): SessionMap {
  return read<SessionMap>(KEYS.sessions, {})
}

export function loadActiveSession(): Session | null {
  const key = read<string | null>(KEYS.active, null)
  if (!key) return null
  return loadSessions()[key] ?? null
}

export function saveSession(session: Session): void {
  const all = loadSessions()
  all[session.key] = session
  write(KEYS.sessions, all)
  write(KEYS.active, session.key)
}

/**
 * Daftar / log masuk murid.
 * - Nama + kelas yang sama → sambung sesi sedia ada (avatar dikemas kini).
 * - Nama atau kelas berbeza → sesi BAHARU (keputusan murid lain tidak dicampur).
 */
export function startSession(student: Student): Session {
  const name = normalise(student.name)
  const className = normalise(student.className)
  const key = studentKey(name, className)
  const existing = loadSessions()[key]
  const session: Session = existing
    ? { ...existing, student: { name, className, avatar: student.avatar } }
    : {
        key,
        student: { name, className, avatar: student.avatar },
        startedAt: new Date().toISOString(),
        progress: emptyProgress(),
      }
  saveSession(session)
  return session
}

export function restartSession(session: Session): Session {
  const fresh: Session = { ...session, startedAt: new Date().toISOString(), progress: emptyProgress() }
  saveSession(fresh)
  return fresh
}

export function logout(): void {
  try {
    localStorage.removeItem(KEYS.active)
  } catch {
    /* abaikan */
  }
}

export function loadMuted(): boolean {
  return read<boolean>(KEYS.muted, false)
}

export function saveMuted(m: boolean): void {
  write(KEYS.muted, m)
}
