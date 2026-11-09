import { motion } from 'motion/react'
import { Rocket, Volume2, VolumeX } from 'lucide-react'
import { useGame } from '../game'
import { ClassroomGuide } from '../components/ClassroomGuide'
import { Arabic, StarShape } from '../components/ui'

export function OpeningScreen({
  muted,
  onToggleMute,
  hasSession,
}: {
  muted: boolean
  onToggleMute: () => void
  hasSession: boolean
}) {
  const { settings, go, sfx, catalog } = useGame()
  return (
    <div className="flex flex-col items-center gap-6 pt-6 text-center">
      <div className="flex w-full justify-end gap-2">
        <button type="button" onClick={onToggleMute} className="btn-ghost rounded-full p-2" aria-label={muted ? 'Hidupkan bunyi' : 'Senyapkan bunyi'}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {settings.schoolLogo && <img src={settings.schoolLogo} alt={`Logo ${settings.schoolName}`} className="h-24 w-24 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,.25)]" />}
      <p className="text-sm font-bold tracking-[0.3em] text-silver-400">{settings.schoolName}</p>

      {/* Galaksi animasi */}
      <div className="relative h-56 w-56 sm:h-72 sm:w-72" aria-hidden>
        {[1, 0.72, 0.44].map((r, i) => (
          <div
            key={r}
            className="spin-slow absolute rounded-full border border-sapphire-300/30"
            style={{
              inset: `${((1 - r) / 2) * 100}%`,
              animationDuration: `${40 + i * 15}s`,
              animationDirection: i % 2 ? 'reverse' : 'normal',
            }}
          >
            {Array.from({ length: 5 }).map((_, k) => (
              <span
                key={k}
                className="absolute"
                style={{
                  left: `${50 + 50 * Math.cos((k / 5) * Math.PI * 2 + i)}%`,
                  top: `${50 + 50 * Math.sin((k / 5) * Math.PI * 2 + i)}%`,
                  transform: 'translate(-50%,-50%)',
                }}
              >
                <StarShape lit size={18 - i * 2} />
              </span>
            ))}
          </div>
        ))}
        <motion.div
          className="absolute inset-[38%] rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-violet-glow shadow-[0_0_60px_rgba(245,197,66,.6)]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        />
      </div>

      <div>
        <h1 className="title-glow font-display text-4xl font-extrabold tracking-wide text-gold-300 sm:text-6xl">GALAKSI SELAWAT</h1>
        <p className="mt-2 font-display text-lg text-silver-200 sm:text-2xl">Misi Tahiyat Akhir</p>
        <p className="mt-1 text-sm text-silver-400">Pendidikan Islam · Tahun 4</p>
      </div>

      <p className="max-w-xl text-silver-200">
        Jelajahi galaksi, nyalakan <strong className="text-gold-300">{catalog.units.length} bintang bacaan</strong>, sambungkan{' '}
        <strong className="text-gold-300">{catalog.orbits.length} orbit</strong> dan lengkapkan bacaan tahiyat akhir!
      </p>
      <Arabic className="text-2xl text-gold-300 sm:text-3xl">اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ</Arabic>

      <button
        type="button"
        className="btn-gold flex items-center gap-2 rounded-2xl px-8 py-4 text-lg"
        onClick={() => {
          sfx('star')
          go({ name: 'register' })
        }}
        data-testid="opening-start"
      >
        <Rocket size={22} aria-hidden /> {hasSession ? 'TERUSKAN / TUKAR MURID' : 'MULA'}
      </button>

      <div className="w-full max-w-2xl text-left">
        <ClassroomGuide compact />
      </div>
    </div>
  )
}
