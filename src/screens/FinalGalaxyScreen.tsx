import { motion } from 'motion/react'
import { Award } from 'lucide-react'
import { useSession } from '../game'
import { UnitOrderChallenge } from '../components/UnitOrderChallenge'
import { Feedback, ParticleBurst, StarShape } from '../components/ui'
import { isFinalUnlocked } from '../lib/progress'

export function PerfectGalaxy() {
  return (
    <div className="relative flex flex-col items-center gap-2 py-4" data-testid="perfect-galaxy">
      <div className="relative h-56 w-56">
        {[1, 0.7, 0.42].map((r, ri) => (
          <motion.div
            key={r}
            className="absolute rounded-full border border-gold-400/70"
            style={{ inset: `${((1 - r) / 2) * 100}%` }}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: ri % 2 ? -360 : 360 }}
            transition={{ scale: { duration: 0.8, delay: ri * 0.25 }, rotate: { repeat: Infinity, duration: 20 + ri * 6, ease: 'linear' } }}
          >
            {Array.from({ length: 5 }).map((_, k) => (
              <span
                key={k}
                className="absolute"
                style={{
                  left: `${50 + 50 * Math.cos((k / 5) * 2 * Math.PI)}%`,
                  top: `${50 + 50 * Math.sin((k / 5) * 2 * Math.PI)}%`,
                  transform: 'translate(-50%,-50%)',
                }}
              >
                <StarShape lit size={22} />
              </span>
            ))}
          </motion.div>
        ))}
        <motion.div
          className="absolute inset-[36%] rounded-full bg-gradient-to-br from-white via-gold-300 to-gold-600 shadow-[0_0_80px_rgba(245,197,66,.8)]"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
        />
        <ParticleBurst trigger={1} count={30} />
      </div>
      <p className="title-glow font-display text-2xl text-gold-300 sm:text-3xl">Galaksi Sempurna!</p>
      <p className="text-silver-200">Anda telah menyusun bacaan tahiyat akhir dengan lengkap.</p>
    </div>
  )
}

export function FinalGalaxyScreen() {
  const { catalog, progress, go } = useSession()
  if (!isFinalUnlocked(progress, catalog)) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p>Final Galaxy dibuka selepas semua 15 bintang dan 3 orbit selesai.</p>
        <button type="button" className="btn-gold mt-4 rounded-xl px-5 py-2" onClick={() => go({ name: 'map' })}>
          Ke Peta
        </button>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-2xl">
      <button type="button" className="mb-3 text-sm text-silver-400 underline" onClick={() => go({ name: 'map' })}>
        ← Peta
      </button>
      <h2 className="text-center font-display text-3xl text-gold-300">Final Galaxy</h2>
      <p className="mb-4 text-center text-sm text-silver-400">Susun kesemua 15 baris bacaan tahiyat akhir mengikut tertib.</p>
      {progress.final ? (
        <div className="glass flex flex-col items-center gap-4 rounded-3xl p-6 text-center" data-testid="final-done">
          <PerfectGalaxy />
          <Feedback kind="ok">Final Galaxy selesai! +{progress.final.xp} XP</Feedback>
          <button type="button" className="btn-gold flex items-center gap-2 rounded-2xl px-6 py-3" onClick={() => go({ name: 'results' })} data-testid="final-results">
            <Award size={18} aria-hidden /> LIHAT ANALISIS PENCAPAIAN
          </button>
        </div>
      ) : (
        <div className="glass rounded-3xl p-4 sm:p-6">
          <UnitOrderChallenge
            type="final"
            challengeId="final"
            units={catalog.units}
            hintCost={20}
            instructions={
              <>
                Kad dipaparkan secara rawak. Letakkan setiap baris pada slot 1 hingga 15. Tekan <strong>PETUNJUK</strong> jika
                buntu (−20 XP setiap petunjuk).
              </>
            }
            onSolvedView={<PerfectGalaxy />}
          />
        </div>
      )}
    </div>
  )
}
