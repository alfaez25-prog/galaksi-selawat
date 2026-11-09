import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Compass, Moon, Orbit, Rocket, Sparkles, Star, type LucideIcon } from 'lucide-react'

/* ---------- Teks Arab ---------- */
export function Arabic({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span lang="ar" dir="rtl" className={`arabic ${className}`}>
      {children}
    </span>
  )
}

/* ---------- Latar bintang ---------- */
export function Starfield({ density = 90 }: { density?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 0.6,
        d: Math.random() * 5 + 2,
        delay: Math.random() * 5,
      })),
    [density],
  )
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {stars.map((st) => (
        <span
          key={st.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            animation: `twinkle ${st.d}s ease-in-out ${st.delay}s infinite`,
            boxShadow: st.s > 2 ? '0 0 6px #fff' : undefined,
          }}
        />
      ))}
      <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-violet-glow/20 blur-3xl" />
      <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-sapphire-500/20 blur-3xl" />
    </div>
  )
}

/* ---------- Letupan partikel ---------- */
export function ParticleBurst({ trigger, color = '#ffe28a', count = 18 }: { trigger: number; color?: string; count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        const r = 60 + Math.random() * 70
        return { id: `${trigger}-${i}`, x: Math.cos(a) * r, y: Math.sin(a) * r, s: 4 + Math.random() * 5 }
      }),
    [trigger, count],
  )
  if (!trigger) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <AnimatePresence>
        {parts.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{ width: p.s, height: p.s, background: color, boxShadow: `0 0 10px ${color}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Bintang SVG ---------- */
export function StarShape({ lit, size = 40, pulse = false }: { lit: boolean; size?: number; pulse?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      animate={pulse ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={pulse ? { repeat: Infinity, duration: 1.8 } : undefined}
      aria-hidden
    >
      <defs>
        <radialGradient id={lit ? 'sg-lit' : 'sg-dim'} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={lit ? '#fffbe6' : '#cfd6ea'} />
          <stop offset="55%" stopColor={lit ? '#f5c542' : '#7b86a8'} />
          <stop offset="100%" stopColor={lit ? '#c9971c' : '#3c4468'} />
        </radialGradient>
      </defs>
      <path
        d="M24 3l5.6 14.2L45 18.6 33.2 28.4 37 43.4 24 35.2 11 43.4l3.8-15L3 18.6l15.4-1.4z"
        fill={`url(#${lit ? 'sg-lit' : 'sg-dim'})`}
        stroke={lit ? '#fff3c4' : '#9aa5c6'}
        strokeWidth="1.2"
        style={{ filter: lit ? 'drop-shadow(0 0 6px rgba(245,197,66,.9))' : undefined }}
      />
    </motion.svg>
  )
}

/* ---------- Avatar ---------- */
export interface AvatarDef {
  id: string
  label: string
  icon: LucideIcon
  from: string
  to: string
}

export const AVATARS: AvatarDef[] = [
  { id: 'roket', label: 'Kapten Roket', icon: Rocket, from: '#2f6fe0', to: '#7c4dff' },
  { id: 'bulan', label: 'Penjaga Bulan', icon: Moon, from: '#7c4dff', to: '#3b1e78' },
  { id: 'bintang', label: 'Pemburu Bintang', icon: Star, from: '#f5c542', to: '#c9971c' },
  { id: 'kompas', label: 'Navigator Kompas', icon: Compass, from: '#1d9bb0', to: '#1d3a8a' },
  { id: 'orbit', label: 'Juruterbang Orbit', icon: Orbit, from: '#d14d9c', to: '#3b1e78' },
  { id: 'cahaya', label: 'Pembawa Cahaya', icon: Sparkles, from: '#b8c1d6', to: '#2f6fe0' },
]

export function avatarById(id: string): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]
}

export function Avatar({ id, size = 44 }: { id: string; size?: number }) {
  const a = avatarById(id)
  const Icon = a.icon
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-gold-300/80"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
      aria-label={a.label}
      role="img"
    >
      <Icon size={size * 0.5} color="#fff" strokeWidth={2.2} />
    </span>
  )
}

/* ---------- Progress bar ---------- */
export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sapphire-500 via-violet-glow to-gold-400"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </div>
    </div>
  )
}

/* ---------- Modal ringkas ---------- */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 font-display text-xl text-gold-300">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Kotak maklum balas ---------- */
export function Feedback({ kind, children }: { kind: 'ok' | 'hint' | 'info'; children: ReactNode }) {
  const styles = {
    ok: 'border-emerald-300/60 bg-emerald-400/15 text-emerald-100',
    hint: 'border-gold-400/60 bg-gold-400/10 text-gold-300',
    info: 'border-sapphire-300/50 bg-sapphire-500/15 text-sapphire-300',
  }[kind]
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border px-4 py-3 text-sm sm:text-base ${styles}`}
    >
      {children}
    </motion.div>
  )
}
