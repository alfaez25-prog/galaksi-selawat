import { Map as MapIcon, Volume2, VolumeX, Zap } from 'lucide-react'
import { useSession } from '../game'
import { completedCount, maxXpFor, totalXp } from '../lib/progress'
import { Avatar, ProgressBar } from './ui'

export function TopBar({ muted, onToggleMute }: { muted: boolean; onToggleMute: () => void }) {
  const { session, progress, catalog, go } = useSession()
  const xp = totalXp(progress)
  const done = completedCount(progress, catalog)
  return (
    <header className="glass sticky top-2 z-30 mt-2 mb-4 rounded-2xl px-3 py-2 sm:px-4">
      <div className="flex items-center gap-3">
        <Avatar id={session.student.avatar} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold leading-tight sm:text-base" data-testid="topbar-name">
            {session.student.name}
          </p>
          <p className="truncate text-xs text-silver-400">{session.student.className}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-1 text-sm font-extrabold text-gold-300" data-testid="topbar-xp">
          <Zap size={14} aria-hidden />
          <span>
            {xp}
            <span className="hidden sm:inline"> / {maxXpFor(catalog)}</span> XP
          </span>
        </div>
        <button type="button" onClick={() => go({ name: 'map' })} className="btn-ghost rounded-full p-2" aria-label="Peta galaksi">
          <MapIcon size={18} />
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          className="btn-ghost rounded-full p-2"
          aria-label={muted ? 'Hidupkan bunyi' : 'Senyapkan bunyi'}
          aria-pressed={muted}
          data-testid="mute-toggle"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ProgressBar value={done} max={catalog.total} label="Kemajuan cabaran" />
        <span className="shrink-0 text-xs font-bold text-silver-200" data-testid="topbar-progress">
          {done}/{catalog.total}
        </span>
      </div>
    </header>
  )
}
