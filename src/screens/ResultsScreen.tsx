import { Award, BookOpen, Lock, RotateCcw, Target, Zap } from 'lucide-react'
import { useSession } from '../game'
import { ClassroomGuide } from '../components/ClassroomGuide'
import { Arabic, Avatar, ProgressBar } from '../components/ui'
import { badgeFor, isGameComplete, mastery, maxXpFor, totalXp } from '../lib/progress'
import { restartSession } from '../lib/storage'
import { XP_RULES_TEXT } from '../lib/scoring'

export function ResultsScreen() {
  const { session, progress, catalog, go } = useSession()
  const complete = isGameComplete(progress, catalog)
  if (!complete) {
    return (
      <div className="glass mx-auto max-w-lg rounded-2xl p-6 text-center" data-testid="results-locked">
        <Lock className="mx-auto mb-2" aria-hidden />
        <p>Analisis pencapaian dibuka selepas semua 34 cabaran selesai.</p>
        <button type="button" className="btn-gold mt-4 rounded-xl px-5 py-2" onClick={() => go({ name: 'map' })}>
          Ke Peta
        </button>
      </div>
    )
  }
  const xp = totalXp(progress)
  const max = maxXpFor(catalog)
  const m = mastery(progress, catalog)
  const badge = badgeFor(m.percent)
  const review = catalog.units.filter((u) => !progress.lafaz[u.id]?.firstTry || !progress.meaning[u.id]?.firstTry)

  const rows = [
    { label: 'Lafaz (15)', ...m.lafaz },
    { label: 'Maksud (15)', ...m.meaning },
    { label: 'Orbit (3)', ...m.orbit },
    { label: 'Final Galaxy (1)', ...m.final },
  ]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h2 className="text-center font-display text-3xl text-gold-300">Analisis Pencapaian</h2>

      <section className="glass flex flex-col items-center gap-3 rounded-3xl p-6 text-center sm:flex-row sm:text-left">
        <Avatar id={session.student.avatar} size={72} />
        <div className="flex-1">
          <p className="text-xl font-extrabold" data-testid="results-name">
            {session.student.name}
          </p>
          <p className="text-silver-400" data-testid="results-class">
            {session.student.className}
          </p>
          <p className="mt-1 font-bold text-gold-300">{badge.label}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gold-400/15 p-3 text-center">
            <Zap className="mx-auto text-gold-300" size={20} aria-hidden />
            <p className="text-2xl font-extrabold text-gold-300" data-testid="results-xp">
              {xp} / {max}
            </p>
            <p className="text-xs text-silver-400">Markah XP</p>
          </div>
          <div className="rounded-2xl bg-sapphire-500/20 p-3 text-center">
            <Target className="mx-auto text-sapphire-300" size={20} aria-hidden />
            <p className="text-2xl font-extrabold text-sapphire-300" data-testid="results-mastery">
              {m.percent}%
            </p>
            <p className="text-xs text-silver-400">Penguasaan</p>
          </div>
        </div>
      </section>

      <section className="glass rounded-3xl p-5">
        <h3 className="mb-3 font-display text-lg text-gold-300">Ketepatan percubaan pertama</h3>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{r.label}</span>
                <span className="font-bold">
                  {r.firstTry}/{r.total}
                </span>
              </div>
              <ProgressBar value={r.firstTry} max={r.total} label={r.label} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-silver-400">
          Penguasaan = {m.firstTry} daripada {m.total} cabaran betul pada percubaan pertama tanpa petunjuk. Dikira berasingan daripada XP.
        </p>
      </section>

      <section className="glass rounded-3xl p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-gold-300">
          <BookOpen size={18} aria-hidden /> Baris untuk diulang kaji
        </h3>
        {review.length === 0 ? (
          <p className="text-silver-200">MasyaAllah! Semua baris dijawab tepat pada percubaan pertama.</p>
        ) : (
          <ul className="space-y-2">
            {review.map((u) => (
              <li key={u.id} className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-silver-400">Unit {u.order}</span>
                  <span className="text-xs text-silver-400">
                    {!progress.lafaz[u.id]?.firstTry && 'Lafaz '}
                    {!progress.meaning[u.id]?.firstTry && 'Maksud'}
                  </span>
                </div>
                <Arabic className="block text-right text-2xl">{u.arabic}</Arabic>
                <p className="text-sm text-silver-200">{u.meaning}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="glass rounded-2xl p-4 text-sm text-silver-200">
        <summary className="cursor-pointer font-bold">Peraturan XP</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {XP_RULES_TEXT.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-gold flex items-center gap-2 rounded-2xl px-6 py-3 text-lg" onClick={() => go({ name: 'certificate' })} data-testid="results-certificate">
          <Award size={20} aria-hidden /> LIHAT SIJIL
        </button>
        <button
          type="button"
          className="btn-ghost flex items-center gap-2 rounded-2xl px-5 py-3"
          onClick={() => {
            if (confirm('Mulakan semula misi? Kemajuan murid ini akan dipadam.')) {
              restartSession(session)
              window.location.reload()
            }
          }}
        >
          <RotateCcw size={18} aria-hidden /> Main semula
        </button>
      </div>

      <ClassroomGuide />
    </div>
  )
}
