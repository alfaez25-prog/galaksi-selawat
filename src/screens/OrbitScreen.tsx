import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useSession } from '../game'
import { UnitOrderChallenge } from '../components/UnitOrderChallenge'
import { Feedback, StarShape } from '../components/ui'
import { isOrbitUnlocked } from '../lib/progress'
import { nextTarget } from './StarMapScreen'

export function OrbitAnimation({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2" data-testid="orbit-animation">
      <div className="relative h-44 w-44">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold-400 shadow-[0_0_30px_rgba(245,197,66,.5)]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                left: `${50 + 50 * Math.cos((i / count) * 2 * Math.PI)}%`,
                top: `${50 + 50 * Math.sin((i / count) * 2 * Math.PI)}%`,
                transform: 'translate(-50%,-50%)',
              }}
            >
              <StarShape lit size={26} />
            </span>
          ))}
        </motion.div>
        <motion.div
          className="absolute inset-[30%] rounded-full bg-gradient-to-br from-gold-300 to-violet-glow"
          animate={{ scale: [0.8, 1.1, 1] }}
          transition={{ duration: 1.2 }}
        />
      </div>
      <p className="font-display text-xl text-gold-300">{label}</p>
    </div>
  )
}

export function OrbitScreen({ orbitId }: { orbitId: string }) {
  const { catalog, progress, go } = useSession()
  const idx = catalog.orbits.findIndex((o) => o.id === orbitId)
  const orbit = catalog.orbits[idx]
  if (!orbit || !isOrbitUnlocked(progress, catalog, orbitId)) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p>Orbit ini masih dikunci. Nyalakan semua bintang dalam orbit ini dahulu.</p>
        <button type="button" className="btn-gold mt-4 rounded-xl px-5 py-2" onClick={() => go({ name: 'map' })}>
          Ke Peta
        </button>
      </div>
    )
  }
  const units = orbit.unitIds.map((id) => catalog.units.find((u) => u.id === id)!)
  const result = progress.orbit[orbitId]

  return (
    <div className="mx-auto max-w-2xl">
      <button type="button" className="mb-3 text-sm text-silver-400 underline" onClick={() => go({ name: 'map' })}>
        ← Peta
      </button>
      <h2 className="text-center font-display text-2xl text-gold-300" data-testid="orbit-title">
        Orbit {idx + 1}: {orbit.name}
      </h2>
      <p className="mb-4 text-center text-sm text-silver-400">
        Sambungan Orbit · Unit {idx * 5 + 1}–{idx * 5 + 5}
      </p>
      {result ? (
        <div className="glass flex flex-col items-center gap-4 rounded-3xl p-6 text-center" data-testid="orbit-done">
          <OrbitAnimation count={units.length} label={`Orbit ${idx + 1} Bersambung!`} />
          <Feedback kind="ok">Susunan orbit tepat! +{result.xp} XP</Feedback>
          <button type="button" className="btn-gold flex items-center gap-2 rounded-2xl px-6 py-3" onClick={() => go(nextTarget(progress, catalog))} data-testid="orbit-next">
            Teruskan <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="glass rounded-3xl p-4 sm:p-6">
          <UnitOrderChallenge
            key={orbitId}
            type="orbit"
            challengeId={orbitId}
            units={units}
            hintCost={10}
            instructions={<>Susun 5 kad baris bacaan mengikut tertib. Garisan cahaya akan menyambungkan bintang.</>}
            onSolvedView={<OrbitAnimation count={units.length} label="Orbit bercahaya!" />}
          />
        </div>
      )}
    </div>
  )
}
