import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { useSession } from '../game'
import { Arabic, Feedback, ParticleBurst, StarShape } from '../components/ui'
import { XP_RULES_TEXT } from '../lib/scoring'

const DEMO_OPTIONS = ['الرَّحْمَنِ', 'الْعَالَمِينَ', 'الصَّالِحِينَ', 'النَّبِيُّ']

export function TutorialScreen() {
  const { setProgress, go, sfx } = useSession()
  const [step, setStep] = useState(0)
  const [lit, setLit] = useState(false)
  const [burst, setBurst] = useState(0)
  const [demoPick, setDemoPick] = useState<string | null>(null)
  const [order, setOrder] = useState<string[]>([])

  const orderCards = ['Pertama', 'Kedua', 'Ketiga']
  const orderOk = order.join() === orderCards.join()

  const finish = () => {
    setProgress((p) => ({ ...p, tutorialDone: true }))
    sfx('orbit')
    go({ name: 'map' })
  }

  const steps = [
    {
      title: '1. Nyalakan bintang',
      done: lit,
      body: (
        <div className="flex flex-col items-center gap-3">
          <p>Setiap bintang mengandungi satu baris bacaan. Ketik bintang di bawah untuk mengaktifkannya.</p>
          <button
            type="button"
            data-testid="tut-star"
            className="relative rounded-full p-4"
            onClick={() => {
              setLit(true)
              setBurst((b) => b + 1)
              sfx('star')
            }}
            aria-label="Bintang latihan"
          >
            <StarShape lit={lit} size={84} pulse={!lit} />
            <ParticleBurst trigger={burst} />
          </button>
          {lit && <Feedback kind="ok">Hebat! Bintang menyala apabila jawapan anda betul.</Feedback>}
        </div>
      ),
    },
    {
      title: '2. Lengkapkan lafaz',
      done: demoPick === DEMO_OPTIONS[0],
      body: (
        <div className="flex flex-col items-center gap-3">
          <p>Pilih perkataan yang hilang. (Contoh latihan: Basmalah)</p>
          <div className="card-arabic rounded-2xl px-4 py-2 text-3xl" dir="rtl">
            <Arabic>
              بِسْمِ اللَّهِ{' '}
              <span className="mx-1 inline-block min-w-16 border-b-2 border-dashed border-violet-deep text-violet-deep">
                {demoPick === DEMO_OPTIONS[0] ? DEMO_OPTIONS[0] : '؟'}
              </span>{' '}
              الرَّحِيمِ
            </Arabic>
          </div>
          <div className="grid w-full grid-cols-2 gap-2" dir="rtl">
            {DEMO_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                data-testid="tut-option"
                onClick={() => {
                  setDemoPick(o)
                  sfx(o === DEMO_OPTIONS[0] ? 'correct' : 'hint')
                }}
                className={`card-arabic rounded-xl py-1 text-2xl ${demoPick === o && o !== DEMO_OPTIONS[0] ? 'opacity-50' : ''}`}
              >
                <Arabic>{o}</Arabic>
              </button>
            ))}
          </div>
          {demoPick && demoPick !== DEMO_OPTIONS[0] && (
            <Feedback kind="hint">Belum tepat. Petunjuk akan diberi dan anda boleh cuba lagi. (Petunjuk: Maha Pemurah)</Feedback>
          )}
          {demoPick === DEMO_OPTIONS[0] && <Feedback kind="ok">Betul! Selepas lafaz, anda akan memilih maksud baris itu.</Feedback>}
        </div>
      ),
    },
    {
      title: '3. Susun kad mengikut tertib',
      done: orderOk,
      body: (
        <div className="flex flex-col items-center gap-3">
          <p>Ketik kad mengikut urutan yang betul. Dalam permainan sebenar, anda juga boleh seret kad ke slot.</p>
          <div className="flex min-h-12 gap-2">
            {order.map((o) => (
              <span key={o} className="rounded-lg border border-gold-400 bg-gold-400/15 px-3 py-2 font-bold text-gold-300">
                {o}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            {['Ketiga', 'Pertama', 'Kedua']
              .filter((c) => !order.includes(c))
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  data-testid="tut-order"
                  className="btn-ghost rounded-lg px-3 py-2"
                  onClick={() => {
                    const next = [...order, c]
                    setOrder(next.length === 3 && next.join() !== orderCards.join() ? [] : next)
                    sfx(next.length === 3 && next.join() !== orderCards.join() ? 'hint' : 'click')
                  }}
                >
                  {c}
                </button>
              ))}
          </div>
          {orderOk && <Feedback kind="ok">Cemerlang! Garisan cahaya akan menyambungkan bintang apabila susunan betul.</Feedback>}
        </div>
      ),
    },
    {
      title: '4. Peraturan XP',
      done: true,
      body: (
        <div className="space-y-2 text-left">
          <p>Jawab dengan teliti — percubaan pertama memberi XP penuh. Markah maksimum ialah 2000 XP.</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-silver-200">
            {XP_RULES_TEXT.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="text-sm text-silver-400">Bintang dibuka satu demi satu. Tiada unit boleh dilangkau.</p>
        </div>
      ),
    },
  ]

  const cur = steps[step]

  return (
    <div className="mx-auto max-w-xl pt-2">
      <h2 className="mb-2 text-center font-display text-2xl text-gold-300">Tutorial Interaktif</h2>
      <div className="mb-4 flex justify-center gap-2">
        {steps.map((s, i) => (
          <span key={s.title} className={`h-2 w-10 rounded-full ${i <= step ? 'bg-gold-400' : 'bg-white/15'}`} />
        ))}
      </div>
      <motion.section key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-3xl p-5 text-center sm:p-7">
        <h3 className="mb-3 font-display text-xl">{cur.title}</h3>
        {cur.body}
        <div className="mt-5 flex justify-between gap-2">
          <button type="button" className="btn-ghost rounded-xl px-4 py-2 text-sm" onClick={finish} data-testid="tut-skip">
            Langkau tutorial
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={!cur.done}
              onClick={() => setStep(step + 1)}
              className="btn-gold flex items-center gap-1 rounded-xl px-5 py-2"
              data-testid="tut-next"
            >
              Seterusnya <ArrowRight size={18} aria-hidden />
            </button>
          ) : (
            <button type="button" onClick={finish} className="btn-gold flex items-center gap-1 rounded-xl px-5 py-2" data-testid="tut-finish">
              <Check size={18} aria-hidden /> Ke Peta Galaksi
            </button>
          )}
        </div>
      </motion.section>
    </div>
  )
}
