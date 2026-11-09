import { useMemo, useState } from 'react'
import { Rocket, UserRound } from 'lucide-react'
import { useGame } from '../game'
import { AVATARS, Avatar } from '../components/ui'
import { isRegistrationValid, validateRegistration } from '../lib/validation'
import { loadActiveSession, loadSessions, startSession, studentKey } from '../lib/storage'
import type { Session } from '../lib/progress'

export function RegistrationScreen({ onRegistered }: { onRegistered: (s: Session) => void }) {
  const { settings, sfx, go } = useGame()
  const active = useMemo(() => loadActiveSession(), [])
  const [name, setName] = useState(active?.student.name ?? '')
  const [className, setClassName] = useState(active?.student.className ?? '')
  const [avatar, setAvatar] = useState(active?.student.avatar ?? AVATARS[0].id)
  const [touched, setTouched] = useState({ name: false, className: false })

  const errors = validateRegistration(name, className)
  const valid = isRegistrationValid(name, className)
  const existing = valid ? loadSessions()[studentKey(name, className)] : undefined
  const switching = active && valid && studentKey(name, className) !== active.key

  const submit = () => {
    if (!valid) {
      setTouched({ name: true, className: true })
      return
    }
    sfx('star')
    onRegistered(startSession({ name, className, avatar }))
  }

  return (
    <div className="mx-auto max-w-xl pt-6">
      <button type="button" className="mb-4 text-sm text-silver-400 underline" onClick={() => go({ name: 'opening' })}>
        ← Kembali
      </button>
      <form
        className="glass rounded-3xl p-5 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        noValidate
      >
        <h2 className="mb-1 flex items-center gap-2 font-display text-2xl text-gold-300">
          <UserRound aria-hidden /> Pendaftaran Penjelajah
        </h2>
        <p className="mb-5 text-sm text-silver-400">Isi nama penuh dan kelas sebelum memulakan misi.</p>

        <label className="mb-1 block font-bold" htmlFor="reg-name">
          Nama penuh murid <span className="text-rose-300">*</span>
        </label>
        <input
          id="reg-name"
          data-testid="reg-name"
          className="mb-1 w-full rounded-xl border border-silver-400/40 bg-space-950/60 px-4 py-3 text-lg outline-none focus:border-gold-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="Contoh: Nur Aisyah binti Ahmad"
          autoComplete="name"
          maxLength={80}
          aria-invalid={Boolean(touched.name && errors.name)}
          aria-describedby="reg-name-err"
          required
        />
        <p id="reg-name-err" className="mb-4 min-h-5 text-sm text-rose-300">
          {touched.name && errors.name}
        </p>

        <label className="mb-1 block font-bold" htmlFor="reg-class">
          Kelas <span className="text-rose-300">*</span>
        </label>
        <input
          id="reg-class"
          data-testid="reg-class"
          list="class-list"
          className="mb-1 w-full rounded-xl border border-silver-400/40 bg-space-950/60 px-4 py-3 text-lg outline-none focus:border-gold-400"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, className: true }))}
          placeholder="Contoh: 4 Amanah"
          maxLength={30}
          aria-invalid={Boolean(touched.className && errors.className)}
          aria-describedby="reg-class-err"
          required
        />
        <datalist id="class-list">
          {settings.classes.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {settings.classes.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-2">
            {settings.classes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClassName(c)}
                className={`rounded-full border px-3 py-1 text-sm ${className === c ? 'border-gold-400 bg-gold-400/20 text-gold-300' : 'border-silver-400/30 text-silver-200'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <p id="reg-class-err" className="mb-4 min-h-5 text-sm text-rose-300">
          {touched.className && errors.className}
        </p>

        <fieldset className="mb-5">
          <legend className="mb-2 font-bold">Pilih avatar penjelajah</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  sfx('click')
                  setAvatar(a.id)
                }}
                aria-pressed={avatar === a.id}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] leading-tight ${
                  avatar === a.id ? 'border-gold-400 bg-gold-400/15' : 'border-white/10 bg-white/5'
                }`}
              >
                <Avatar id={a.id} size={46} />
                {a.label}
              </button>
            ))}
          </div>
        </fieldset>

        {existing && !switching && (
          <p className="mb-3 rounded-xl bg-sapphire-500/15 p-3 text-sm text-sapphire-300">
            Kemajuan tersimpan ditemui untuk murid ini. Misi akan disambung.
          </p>
        )}
        {switching && (
          <p className="mb-3 rounded-xl bg-gold-400/10 p-3 text-sm text-gold-300" data-testid="reg-switch-note">
            Nama/kelas berbeza daripada sesi terakhir — {existing ? 'sesi murid ini akan dibuka' : 'sesi baharu akan dimulakan'}. Keputusan murid lain
            tidak akan dicampur.
          </p>
        )}

        <button
          type="submit"
          data-testid="reg-submit"
          disabled={!valid}
          className="btn-gold flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg"
        >
          <Rocket size={20} aria-hidden /> MULA PENGEMBARAAN
        </button>
        <p className="mt-3 text-center text-xs text-silver-400">Maklumat disimpan dalam peranti ini sahaja (localStorage).</p>
      </form>
    </div>
  )
}
