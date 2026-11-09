import { motion } from 'motion/react'
import { Lock, Orbit as OrbitIcon, Play, Sparkles, Trophy } from 'lucide-react'
import { useSession, type Screen } from '../game'
import { StarShape } from '../components/ui'
import { isFinalUnlocked, isGameComplete, isOrbitUnlocked, isStarDone, isStarUnlocked, type Progress } from '../lib/progress'
import type { ChallengeCatalog } from '../lib/challenges'

const RADII = [17, 30, 43]

export function nextTarget(p: Progress, cat: ChallengeCatalog): Screen {
  const u = cat.units.find((x) => !isStarDone(p, x.id))
  if (u) return { name: 'star', unitId: u.id }
  const o = cat.orbits.find((x) => !p.orbit[x.id])
  if (o) return { name: 'orbit', orbitId: o.id }
  if (!p.final) return { name: 'final' }
  return { name: 'results' }
}

export function starPosition(orbitIdx: number, j: number) {
  const ang = ((-90 + j * 72 + orbitIdx * 24) * Math.PI) / 180
  const r = RADII[orbitIdx]
  return { x: 50 + r * Math.cos(ang), y: 50 + r * Math.sin(ang) }
}

export function StarMapScreen() {
  const { progress, catalog, go, sfx } = useSession()
  const next = nextTarget(progress, catalog)
  const complete = isGameComplete(progress, catalog)

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-gold-300 sm:text-3xl">Peta Galaksi</h2>
        <p className="text-sm text-silver-400">Nyalakan 15 bintang mengikut tertib, kemudian sambungkan 3 orbit.</p>
      </div>

      <button
        type="button"
        data-testid="map-continue"
        className="btn-gold flex items-center gap-2 rounded-2xl px-6 py-3 text-lg"
        onClick={() => {
          sfx('click')
          go(next)
        }}
      >
        {complete ? <Trophy size={20} aria-hidden /> : <Play size={20} aria-hidden />}
        {complete ? 'LIHAT KEPUTUSAN' : 'TERUSKAN MISI'}
      </button>

      {/* Galaksi */}
      <div className="relative aspect-square w-full max-w-[560px]" data-testid="star-map">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff7d6" />
              <stop offset="50%" stopColor="#f5c542" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7c4dff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="12" fill="url(#core)" opacity={progress.final ? 1 : 0.45} />
          {catalog.orbits.map((o, oi) => {
            const done = Boolean(progress.orbit[o.id])
            return (
              <g key={o.id}>
                <circle
                  cx="50"
                  cy="50"
                  r={RADII[oi]}
                  fill="none"
                  stroke={done ? '#f5c542' : '#8fb4ff'}
                  strokeOpacity={done ? 0.8 : 0.25}
                  strokeWidth={done ? 0.6 : 0.3}
                  strokeDasharray={done ? undefined : '1 1.2'}
                />
                {o.unitIds.map((id, j) => {
                  if (j === 0) return null
                  const a = starPosition(oi, j - 1)
                  const b = starPosition(oi, j)
                  const on = isStarDone(progress, o.unitIds[j - 1]) && isStarDone(progress, id)
                  return (
                    <motion.line
                      key={id}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={done ? '#ffe28a' : '#8fb4ff'}
                      strokeWidth={on ? 0.5 : 0.15}
                      strokeOpacity={on ? 0.9 : 0.15}
                      initial={false}
                      animate={{ pathLength: on ? 1 : 0.2 }}
                      style={{ filter: on ? 'drop-shadow(0 0 1px #ffe28a)' : undefined }}
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>

        {catalog.orbits.map((o, oi) =>
          o.unitIds.map((id, j) => {
            const unit = catalog.units.find((u) => u.id === id)!
            const pos = starPosition(oi, j)
            const done = isStarDone(progress, id)
            const unlocked = isStarUnlocked(progress, catalog, id)
            const isNext = next.name === 'star' && next.unitId === id
            return (
              <button
                key={id}
                type="button"
                data-testid={`star-${unit.order}`}
                disabled={!unlocked}
                onClick={() => {
                  sfx('click')
                  go({ name: 'star', unitId: id })
                }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center disabled:cursor-not-allowed"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                aria-label={`Bintang ${unit.order}${done ? ' (menyala)' : unlocked ? ' (dibuka)' : ' (dikunci)'}`}
              >
                <span className={`relative ${!unlocked ? 'opacity-40' : ''}`}>
                  <StarShape lit={done} size={isNext ? 44 : 36} pulse={isNext} />
                  {!unlocked && <Lock size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />}
                </span>
                <span className={`mt-[-2px] rounded-full px-1.5 text-[11px] font-extrabold ${done ? 'bg-gold-400 text-space-900' : 'bg-space-900/80 text-silver-200'}`}>
                  {unit.order}
                </span>
              </button>
            )
          }),
        )}

        <button
          type="button"
          data-testid="map-final"
          disabled={!isFinalUnlocked(progress, catalog)}
          onClick={() => go({ name: 'final' })}
          className="absolute left-1/2 top-1/2 flex h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-[10px] font-extrabold text-space-900 disabled:cursor-not-allowed disabled:text-silver-400 sm:text-xs"
          aria-label="Final Galaxy"
        >
          <Sparkles size={18} aria-hidden />
          FINAL
        </button>
      </div>

      {/* Orbit & Final */}
      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {catalog.orbits.map((o, i) => {
          const unlocked = isOrbitUnlocked(progress, catalog, o.id)
          const res = progress.orbit[o.id]
          return (
            <button
              key={o.id}
              type="button"
              data-testid={`orbit-btn-${i + 1}`}
              disabled={!unlocked}
              onClick={() => go({ name: 'orbit', orbitId: o.id })}
              className={`glass flex items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-50 ${res ? 'border-gold-400/70' : ''}`}
            >
              <OrbitIcon className={res ? 'text-gold-400' : 'text-sapphire-300'} aria-hidden />
              <span className="flex-1">
                <span className="block font-extrabold">
                  Orbit {i + 1}: {o.name}
                </span>
                <span className="text-xs text-silver-400">
                  Unit {i * 5 + 1}–{i * 5 + 5} · {res ? `Selesai (+${res.xp} XP)` : unlocked ? 'Sedia disusun' : 'Nyalakan 5 bintang dahulu'}
                </span>
              </span>
              {!unlocked && <Lock size={16} aria-hidden />}
            </button>
          )
        })}
        <button
          type="button"
          disabled={!isFinalUnlocked(progress, catalog)}
          onClick={() => go({ name: 'final' })}
          className={`glass flex items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-50 ${progress.final ? 'border-gold-400/70' : ''}`}
        >
          <Sparkles className="text-gold-400" aria-hidden />
          <span className="flex-1">
            <span className="block font-extrabold">Final Galaxy</span>
            <span className="text-xs text-silver-400">
              {progress.final ? `Selesai (+${progress.final.xp} XP)` : 'Susun kesemua 15 baris'}
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
