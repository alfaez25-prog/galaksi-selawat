import { useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react'
import { useAttempts, useSession } from '../game'
import { SequenceBoard, type SeqItem } from './SequenceBoard'
import { Feedback } from './ui'
import { checkSequence } from '../lib/challenges'
import { shuffleNotIdentity } from '../lib/random'
import type { UnitData } from '../data/types'

interface Props {
  type: 'orbit' | 'final'
  challengeId: string
  units: UnitData[]
  instructions: ReactNode
  onSolvedView: ReactNode
  hintCost: number
}

export function UnitOrderChallenge({ type, challengeId, units, instructions, onSolvedView, hintCost }: Props) {
  const { sfx } = useSession()
  const { wrong, hints, addWrong, addHint, complete } = useAttempts(type, challengeId)
  const expected = useMemo(() => units.map((u) => u.id), [units])
  const baseItems: SeqItem[] = useMemo(() => units.map((u) => ({ id: u.id, text: u.arabic })), [units])
  const textOf = (id: string) => units.find((u) => u.id === id)?.arabic ?? ''

  const [items, setItems] = useState(() => shuffleNotIdentity(baseItems, (i) => i.text))
  const [placed, setPlaced] = useState<(string | null)[]>(() => expected.map(() => null))
  const [locked, setLocked] = useState<number[]>([])
  const [status, setStatus] = useState<(boolean | null)[] | undefined>()
  const [message, setMessage] = useState<{ kind: 'hint' | 'info'; text: string } | null>(null)
  const [solved, setSolved] = useState(false)

  const full = placed.every((p) => p !== null)

  const check = () => {
    const r = checkSequence(placed, expected, textOf)
    setStatus(r.slots)
    if (r.correct) {
      setSolved(true)
      setMessage(null)
      sfx(type === 'final' ? 'victory' : 'orbit')
      setTimeout(complete, type === 'final' ? 2600 : 2000)
    } else {
      sfx('hint')
      addWrong()
      setMessage({
        kind: 'hint',
        text: `${r.correctCount} daripada ${expected.length} kedudukan betul. Kad bertanda merah perlu dialihkan. Cuba lagi!`,
      })
    }
  }

  const hint = () => {
    if (solved) return
    const r = checkSequence(placed, expected, textOf)
    const slot = expected.findIndex((_, i) => !locked.includes(i) && r.slots[i] !== true)
    if (slot < 0) {
      setMessage({ kind: 'info', text: 'Semua kad yang diletakkan sudah betul. Lengkapkan slot kosong dan tekan SEMAK SUSUNAN.' })
      return
    }
    const wantText = textOf(expected[slot])
    const candidates = expected.filter((id) => textOf(id) === wantText && !locked.some((l) => placed[l] === id))
    const chosen =
      candidates.find((id) => {
        const at = placed.indexOf(id)
        return at < 0 || r.slots[at] !== true
      }) ?? candidates[0]
    const next = [...placed]
    const from = next.indexOf(chosen)
    if (from >= 0) next[from] = null
    next[slot] = chosen
    setPlaced(next)
    setLocked((l) => [...l, slot])
    setStatus(undefined)
    addHint()
    sfx('hint')
    setMessage({ kind: 'info', text: `Petunjuk: kad untuk slot ${slot + 1} telah diletakkan dan dikunci (−${hintCost} XP).` })
  }

  const retry = () => {
    const keep = locked.map((i) => placed[i])
    setItems(shuffleNotIdentity(baseItems, (i) => i.text))
    setPlaced(expected.map((_, i) => (locked.includes(i) ? (placed[i] ?? null) : null)))
    setStatus(undefined)
    setMessage(keep.length ? { kind: 'info', text: 'Kad dikunci kekal. Susun semula kad lain.' } : null)
  }

  return (
    <div className="flex flex-col gap-4">
      {!solved && <div className="text-center text-sm text-silver-200">{instructions}</div>}
      {solved && onSolvedView}
      <SequenceBoard
        items={items}
        placed={placed}
        onChange={(p) => {
          setPlaced(p)
          setStatus(undefined)
        }}
        slotStatus={status}
        locked={locked}
        layout="lines"
        solved={solved}
        disabled={solved}
        testIdPrefix={type}
      />
      {!solved && (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={!full} onClick={check} className="btn-gold flex items-center gap-1 rounded-xl px-5 py-2.5" data-testid={`${type}-check`}>
            <CheckCircle2 size={18} aria-hidden /> SEMAK SUSUNAN
          </button>
          <button type="button" onClick={hint} className="btn-ghost flex items-center gap-1 rounded-xl px-4 py-2.5" data-testid={`${type}-hint`}>
            <Lightbulb size={16} aria-hidden /> PETUNJUK
          </button>
          <button type="button" onClick={retry} className="btn-ghost flex items-center gap-1 rounded-xl px-4 py-2.5" data-testid={`${type}-retry`}>
            <RotateCcw size={16} aria-hidden /> CUBA LAGI
          </button>
        </div>
      )}
      {message && !solved && <Feedback kind={message.kind}>{message.text}</Feedback>}
      {!solved && (wrong > 0 || hints > 0) && (
        <p className="text-center text-xs text-silver-400">
          Semakan salah: {wrong} · Petunjuk digunakan: {hints}
        </p>
      )}
    </div>
  )
}
