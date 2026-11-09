import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react'
import { useAttempts, useSession } from '../game'
import { Arabic, Feedback, ParticleBurst, StarShape } from '../components/ui'
import { SequenceBoard } from '../components/SequenceBoard'
import {
  buildLafazChallenge,
  buildMeaningChallenge,
  checkSequence,
  type BlankChallenge,
  type OrderChallenge,
} from '../lib/challenges'
import { isStarUnlocked } from '../lib/progress'
import type { UnitData } from '../data/types'
import { shuffleNotIdentity } from '../lib/random'
import { nextTarget } from './StarMapScreen'

export function StarChallengeScreen({ unitId }: { unitId: string }) {
  const { catalog, progress, go } = useSession()
  const unit = catalog.units.find((u) => u.id === unitId)
  if (!unit || !isStarUnlocked(progress, catalog, unitId)) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p>Bintang ini masih dikunci. Selesaikan bintang sebelumnya dahulu.</p>
        <button type="button" className="btn-gold mt-4 rounded-xl px-5 py-2" onClick={() => go({ name: 'map' })}>
          Ke Peta
        </button>
      </div>
    )
  }
  return <StarChallenge key={unit.id} unit={unit} />
}

function StarChallenge({ unit }: { unit: UnitData }) {
  const { progress, catalog, go } = useSession()
  const lafazDone = Boolean(progress.lafaz[unit.id])
  const meaningDone = Boolean(progress.meaning[unit.id])
  const phase: 'lafaz' | 'meaning' | 'done' = !lafazDone ? 'lafaz' : !meaningDone ? 'meaning' : 'done'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" className="text-sm text-silver-400 underline" onClick={() => go({ name: 'map' })}>
          ← Peta
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 font-bold ${phase === 'lafaz' ? 'bg-sapphire-500 text-white' : 'bg-white/10 text-silver-400'}`}>
            Fasa 1: Lafaz
          </span>
          <span className={`rounded-full px-3 py-1 font-bold ${phase === 'meaning' ? 'bg-violet-glow text-white' : 'bg-white/10 text-silver-400'}`}>
            Fasa 2: Maksud
          </span>
        </div>
      </div>
      <h2 className="mb-4 text-center font-display text-2xl text-gold-300" data-testid="star-title">
        Bintang {unit.order} / {catalog.units.length}
      </h2>
      {phase === 'lafaz' && <LafazPhase unit={unit} />}
      {phase === 'meaning' && <MeaningPhase unit={unit} />}
      {phase === 'done' && <StarDone unit={unit} onNext={() => go(nextTarget(progress, catalog))} />}
    </div>
  )
}

/* ================= FASA 1: LAFAZ ================= */
function LafazPhase({ unit }: { unit: UnitData }) {
  const challenge = useMemo(() => buildLafazChallenge(unit), [unit])
  return challenge.kind === 'blank' ? <BlankLafaz unit={unit} ch={challenge} /> : <OrderLafaz unit={unit} ch={challenge} />
}

function BlankLafaz({ unit, ch }: { unit: UnitData; ch: BlankChallenge }) {
  const { sfx } = useSession()
  const { wrong, addWrong, complete } = useAttempts('lafaz', unit.id)
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [burst, setBurst] = useState(0)

  const pick = (opt: string) => {
    if (solved) return
    if (opt === ch.answer) {
      setSolved(true)
      setBurst((b) => b + 1)
      sfx('star')
      setTimeout(complete, 1100)
    } else {
      sfx('hint')
      setWrongPicks((w) => [...w, opt])
      addWrong()
    }
  }

  return (
    <section className="glass relative rounded-3xl p-5 sm:p-7" data-testid="lafaz-blank">
      <p className="mb-3 text-center font-bold">Lengkapkan lafaz dengan memilih perkataan yang hilang.</p>
      <div className="card-arabic relative mx-auto mb-5 rounded-2xl px-4 py-3 text-center text-3xl sm:text-4xl" dir="rtl">
        <Arabic>
          {ch.before.join(' ')}{' '}
          <motion.span
            className={`mx-1 inline-block min-w-24 rounded-lg border-b-4 px-2 ${solved ? 'border-gold-600 bg-gold-300/60' : 'border-dashed border-violet-deep'}`}
            animate={solved ? { scale: [1, 1.15, 1] } : undefined}
            data-testid="lafaz-blank-slot"
          >
            {solved ? ch.answer : ' ؟ '}
          </motion.span>{' '}
          {ch.after.join(' ')}
        </Arabic>
        <ParticleBurst trigger={burst} />
      </div>
      <div className="grid grid-cols-2 gap-3" dir="rtl">
        {ch.options.map((o) => {
          const isWrong = wrongPicks.includes(o)
          const isRight = solved && o === ch.answer
          return (
            <button
              key={o}
              type="button"
              data-testid="lafaz-option"
              data-text={o}
              disabled={isWrong || solved}
              onClick={() => pick(o)}
              className={`card-arabic rounded-2xl px-2 py-2 text-2xl transition sm:text-3xl ${isWrong ? 'opacity-40 line-through' : ''} ${
                isRight ? 'ring-4 ring-gold-400' : ''
              }`}
            >
              <Arabic>{o}</Arabic>
            </button>
          )
        })}
      </div>
      <div className="mt-4 space-y-2">
        {wrong > 0 && !solved && (
          <Feedback kind="hint">
            <Lightbulb size={16} className="mr-1 inline" aria-hidden /> Petunjuk: {unit.lafazHint} Cuba lagi!
          </Feedback>
        )}
        {solved && <Feedback kind="ok">Betul! Bintang mula bercahaya… Seterusnya: maksud baris ini.</Feedback>}
      </div>
    </section>
  )
}

function OrderLafaz({ unit, ch }: { unit: UnitData; ch: OrderChallenge }) {
  const { sfx } = useSession()
  const { wrong, addWrong, complete } = useAttempts('lafaz', unit.id)
  const [items, setItems] = useState(() => shuffleNotIdentity(ch.tokens, (t) => t.text))
  const [placed, setPlaced] = useState<(string | null)[]>(() => ch.tokens.map(() => null))
  const [status, setStatus] = useState<(boolean | null)[] | undefined>()
  const [solved, setSolved] = useState(false)
  const [burst, setBurst] = useState(0)
  const textOf = (id: string) => ch.tokens.find((t) => t.id === id)?.text ?? ''
  const full = placed.every((p) => p !== null)

  const check = () => {
    const r = checkSequence(
      placed,
      ch.tokens.map((t) => t.id),
      textOf,
    )
    setStatus(r.slots)
    if (r.correct) {
      setSolved(true)
      setBurst((b) => b + 1)
      sfx('star')
      setTimeout(complete, 1100)
    } else {
      sfx('hint')
      addWrong()
    }
  }

  return (
    <section className="glass relative rounded-3xl p-5 sm:p-7" data-testid="lafaz-order">
      <p className="mb-1 text-center font-bold">Susun kad perkataan mengikut lafaz yang betul.</p>
      <p className="mb-4 text-center text-xs text-silver-400">Bacaan Arab dari kanan ke kiri — slot pertama berada di sebelah kanan.</p>
      <div className="relative">
        <SequenceBoard
          items={items}
          placed={placed}
          onChange={(p) => {
            setPlaced(p)
            setStatus(undefined)
          }}
          slotStatus={status}
          layout="words"
          solved={solved}
          disabled={solved}
          testIdPrefix="word"
        />
        <ParticleBurst trigger={burst} />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" disabled={!full || solved} onClick={check} className="btn-gold flex items-center gap-1 rounded-xl px-5 py-2.5" data-testid="word-check">
          <CheckCircle2 size={18} aria-hidden /> SEMAK
        </button>
        <button
          type="button"
          disabled={solved}
          onClick={() => {
            setItems(shuffleNotIdentity(ch.tokens, (t) => t.text))
            setPlaced(ch.tokens.map(() => null))
            setStatus(undefined)
          }}
          className="btn-ghost flex items-center gap-1 rounded-xl px-4 py-2.5"
        >
          <RotateCcw size={16} aria-hidden /> CUBA LAGI
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {wrong > 0 && !solved && (
          <Feedback kind="hint">
            <Lightbulb size={16} className="mr-1 inline" aria-hidden /> Petunjuk: {unit.lafazHint} Kad bertanda merah berada di kedudukan yang salah.
          </Feedback>
        )}
        {solved && <Feedback kind="ok">Susunan tepat! Seterusnya: maksud baris ini.</Feedback>}
      </div>
    </section>
  )
}

/* ================= FASA 2: MAKSUD ================= */
function MeaningPhase({ unit }: { unit: UnitData }) {
  const { sfx } = useSession()
  const ch = useMemo(() => buildMeaningChallenge(unit), [unit])
  const { wrong, addWrong, complete } = useAttempts('meaning', unit.id)
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [burst, setBurst] = useState(0)

  const pick = (o: string) => {
    if (solved) return
    if (o === ch.answer) {
      setSolved(true)
      setBurst((b) => b + 1)
      sfx('correct')
      setTimeout(complete, 1000)
    } else {
      sfx('hint')
      setWrongPicks((w) => [...w, o])
      addWrong()
    }
  }

  return (
    <section className="glass relative rounded-3xl p-5 sm:p-7" data-testid="meaning">
      <div className="card-arabic relative mb-4 rounded-2xl px-4 py-3 text-center text-3xl sm:text-4xl">
        <Arabic>{unit.arabic}</Arabic>
        <ParticleBurst trigger={burst} color="#c4b5fd" />
      </div>
      <p className="mb-3 text-center text-lg font-extrabold">{ch.question}</p>
      <div className="grid gap-2">
        {ch.options.map((o, i) => {
          const isWrong = wrongPicks.includes(o)
          const isRight = solved && o === ch.answer
          return (
            <button
              key={o}
              type="button"
              data-testid="meaning-option"
              data-text={o}
              disabled={isWrong || solved}
              onClick={() => pick(o)}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                isRight
                  ? 'border-gold-400 bg-gold-400/20'
                  : isWrong
                    ? 'border-rose-400/40 bg-rose-500/10 opacity-50 line-through'
                    : 'border-white/15 bg-white/5 hover:border-sapphire-300 hover:bg-sapphire-500/15'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{o}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 space-y-2">
        {wrong > 0 && !solved && (
          <Feedback kind="hint">
            <Lightbulb size={16} className="mr-1 inline" aria-hidden /> Petunjuk: <span>{unit.meaningHint}</span>
          </Feedback>
        )}
        {solved && <Feedback kind="ok">Tepat sekali! Bintang {unit.order} kini menyala sepenuhnya.</Feedback>}
      </div>
    </section>
  )
}

function StarDone({ unit, onNext }: { unit: UnitData; onNext: () => void }) {
  const { progress } = useSession()
  const l = progress.lafaz[unit.id]
  const m = progress.meaning[unit.id]
  return (
    <motion.section initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass relative flex flex-col items-center gap-3 rounded-3xl p-6 text-center" data-testid="star-done">
      <div className="relative">
        <StarShape lit size={110} pulse />
        <ParticleBurst trigger={1} count={24} />
      </div>
      <h3 className="font-display text-2xl text-gold-300">Bintang {unit.order} Menyala!</h3>
      <div className="card-arabic rounded-2xl px-4 py-2 text-3xl">
        <Arabic>{unit.arabic}</Arabic>
      </div>
      <p className="text-silver-200">{unit.meaning}</p>
      <p className="text-sm text-gold-300">
        Lafaz +{l?.xp ?? 0} XP · Maksud +{m?.xp ?? 0} XP
      </p>
      <button type="button" onClick={onNext} className="btn-gold flex items-center gap-2 rounded-2xl px-6 py-3" data-testid="star-next">
        Teruskan <ArrowRight size={18} aria-hidden />
      </button>
    </motion.section>
  )
}
