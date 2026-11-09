import { motion, LayoutGroup } from 'motion/react'
import { useState, type DragEvent } from 'react'
import { Lock } from 'lucide-react'
import { Arabic, StarShape } from './ui'

export interface SeqItem {
  id: string
  text: string
}

interface Props {
  items: SeqItem[]
  placed: (string | null)[]
  onChange: (placed: (string | null)[]) => void
  /** Status setiap slot daripada semakan terakhir */
  slotStatus?: (boolean | null)[]
  locked?: number[]
  layout: 'words' | 'lines'
  disabled?: boolean
  solved?: boolean
  testIdPrefix?: string
}

const DND_TYPE = 'text/plain'

export function SequenceBoard({
  items,
  placed,
  onChange,
  slotStatus,
  locked = [],
  layout,
  disabled,
  solved,
  testIdPrefix = 'seq',
}: Props) {
  const [dragOver, setDragOver] = useState<number | 'pool' | null>(null)
  const byId = new Map(items.map((i) => [i.id, i]))
  const pool = items.filter((i) => !placed.includes(i.id))

  const placeAt = (id: string, slot: number) => {
    if (disabled || locked.includes(slot)) return
    const next = [...placed]
    const from = next.indexOf(id)
    const occupant = next[slot]
    if (from >= 0) {
      if (locked.includes(from)) return
      next[from] = occupant ?? null // tukar tempat
    }
    next[slot] = id
    onChange(next)
  }

  const placeFirstEmpty = (id: string) => {
    if (disabled) return
    const slot = placed.findIndex((p, i) => p === null && !locked.includes(i))
    if (slot >= 0) placeAt(id, slot)
  }

  const removeFrom = (slot: number) => {
    if (disabled || locked.includes(slot)) return
    const next = [...placed]
    next[slot] = null
    onChange(next)
  }

  const onDragStart = (e: DragEvent, id: string) => {
    e.dataTransfer.setData(DND_TYPE, id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDropSlot = (e: DragEvent, slot: number) => {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData(DND_TYPE)
    if (id && byId.has(id)) placeAt(id, slot)
  }
  const onDropPool = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData(DND_TYPE)
    const from = placed.indexOf(id)
    if (from >= 0) removeFrom(from)
  }

  const isWords = layout === 'words'

  const card = (item: SeqItem, where: 'pool' | number) => (
    <motion.div
      layout
      layoutId={item.id}
      key={item.id}
      className={isWords ? '' : 'w-full'}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
    >
      <button
        type="button"
        draggable={!disabled && !(typeof where === 'number' && locked.includes(where))}
        onDragStart={(e) => onDragStart(e, item.id)}
        onClick={() => (where === 'pool' ? placeFirstEmpty(item.id) : removeFrom(where))}
        disabled={disabled}
        data-testid={`${testIdPrefix}-card`}
        data-text={item.text}
        aria-label={where === 'pool' ? `Letak kad: ${item.text}` : `Keluarkan kad: ${item.text}`}
        className={`card-arabic cursor-grab rounded-xl px-3 text-center active:cursor-grabbing ${
          isWords ? 'py-1 text-2xl sm:text-3xl' : 'w-full py-1.5 text-xl sm:text-2xl'
        }`}
      >
        <Arabic>{item.text}</Arabic>
      </button>
    </motion.div>
  )

  return (
    <LayoutGroup>
      <div className="flex flex-col gap-5">
        {/* SLOT */}
        <div
          className={isWords ? 'flex flex-wrap justify-center gap-2' : 'relative flex flex-col gap-2'}
          dir={isWords ? 'rtl' : undefined}
          data-testid={`${testIdPrefix}-slots`}
        >
          {placed.map((pid, i) => {
            const item = pid ? byId.get(pid) : undefined
            const status = slotStatus?.[i]
            const ring =
              solved || status === true
                ? 'border-gold-400 shadow-[0_0_14px_rgba(245,197,66,.55)]'
                : status === false
                  ? 'border-rose-400 shadow-[0_0_12px_rgba(251,113,133,.5)]'
                  : dragOver === i
                    ? 'border-sapphire-300 bg-sapphire-500/20'
                    : 'border-silver-400/40 border-dashed'
            const prevFilled = i > 0 && placed[i - 1] !== null && pid !== null
            return (
              <div
                key={i}
                className={isWords ? '' : 'flex items-center gap-2'}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(i)
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDropSlot(e, i)}
              >
                {!isWords && (
                  <div className="relative flex w-9 shrink-0 flex-col items-center self-stretch">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className={`absolute -top-2 h-1/2 w-0.5 transition-colors duration-500 ${
                          solved ? 'bg-gold-400 shadow-[0_0_8px_#f5c542]' : prevFilled ? 'bg-sapphire-300/80' : 'bg-white/10'
                        }`}
                      />
                    )}
                    {i < placed.length - 1 && (
                      <span
                        aria-hidden
                        className={`absolute -bottom-2 h-1/2 w-0.5 transition-colors duration-500 ${
                          solved
                            ? 'bg-gold-400 shadow-[0_0_8px_#f5c542]'
                            : pid !== null && placed[i + 1] !== null
                              ? 'bg-sapphire-300/80'
                              : 'bg-white/10'
                        }`}
                      />
                    )}
                    <div className="relative z-10 my-auto flex flex-col items-center">
                      <StarShape lit={Boolean(solved || pid)} size={26} />
                      <span className="text-[10px] font-bold text-silver-400">{i + 1}</span>
                    </div>
                  </div>
                )}
                <div
                  data-testid={`${testIdPrefix}-slot-${i}`}
                  className={`relative flex items-center justify-center rounded-xl border-2 p-1 transition-colors ${ring} ${
                    isWords ? 'min-h-14 min-w-20' : 'min-h-14 flex-1'
                  }`}
                >
                  {item ? (
                    card(item, i)
                  ) : (
                    <span className="text-xs text-silver-400/70">{isWords ? '' : `Slot ${i + 1}`}</span>
                  )}
                  {locked.includes(i) && (
                    <Lock size={14} className="absolute -left-1 -top-1 rounded-full bg-gold-400 p-0.5 text-space-900" aria-label="Dikunci oleh petunjuk" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* KOLAM KAD */}
        {!solved && (
          <div
            className={`rounded-2xl border border-white/10 bg-space-950/40 p-3 ${dragOver === 'pool' ? 'border-sapphire-300' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver('pool')
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={onDropPool}
            data-testid={`${testIdPrefix}-pool`}
          >
            <p className="mb-2 text-center text-xs text-silver-400">
              Seret kad ke slot, atau ketik kad untuk meletakkannya di slot kosong seterusnya. Ketik kad dalam slot untuk mengeluarkannya.
            </p>
            <div className={isWords ? 'flex flex-wrap justify-center gap-2' : 'grid gap-2 sm:grid-cols-2'} dir={isWords ? 'rtl' : undefined}>
              {pool.length === 0 ? (
                <p dir="ltr" className="col-span-full text-center text-sm text-silver-400">Semua kad telah diletakkan. Tekan semak!</p>
              ) : (
                pool.map((it) => card(it, 'pool'))
              )}
            </div>
          </div>
        )}
      </div>
    </LayoutGroup>
  )
}
