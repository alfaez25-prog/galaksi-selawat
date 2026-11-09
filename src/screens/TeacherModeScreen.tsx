import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { AlertTriangle, Download, KeyRound, RotateCcw, Save, Upload } from 'lucide-react'
import { useGame } from '../game'
import type { LafazMode, TeacherSettings, UnitData } from '../data/types'
import { buildCatalog, splitWords, validateUnits } from '../lib/challenges'
import {
  exportSettingsJson,
  importSettingsJson,
  loadSessions,
  resetSettings,
  saveSettings,
} from '../lib/storage'
import { isGameComplete, mastery, totalXp } from '../lib/progress'
import { Arabic, Feedback } from '../components/ui'

type Tab = 'umum' | 'sijil' | 'soalan' | 'json' | 'murid'

const input =
  'w-full rounded-lg border border-silver-400/40 bg-space-950/60 px-3 py-2 outline-none focus:border-gold-400'

export function TeacherModeScreen({ onSave, onExit }: { onSave: (s: TeacherSettings) => void; onExit: () => void }) {
  const { settings } = useGame()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState(false)
  const [draft, setDraft] = useState<TeacherSettings>(() => structuredClone(settings))
  const [tab, setTab] = useState<Tab>('umum')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null)
  const unitErrors = useMemo(() => validateUnits(draft.units), [draft.units])

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm pt-10">
        <form
          className="glass rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (pin === settings.teacherPin) setUnlocked(true)
            else setPinErr(true)
          }}
        >
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-gold-300">
            <KeyRound aria-hidden /> Mod Guru
          </h2>
          <label htmlFor="pin" className="mb-1 block text-sm">
            PIN guru (lalai: 1234)
          </label>
          <input id="pin" data-testid="teacher-pin" type="password" inputMode="numeric" className={input} value={pin} onChange={(e) => setPin(e.target.value)} />
          {pinErr && <p className="mt-1 text-sm text-rose-300">PIN tidak tepat.</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-gold rounded-xl px-4 py-2" data-testid="teacher-unlock">
              Masuk
            </button>
            <button type="button" className="btn-ghost rounded-xl px-4 py-2" onClick={onExit}>
              Batal
            </button>
          </div>
          <p className="mt-4 text-xs text-silver-400">
            PIN ini hanya menghalang murid daripada mengubah tetapan secara tidak sengaja. Ia bukan kawalan keselamatan.
          </p>
        </form>
      </div>
    )
  }

  const set = <K extends keyof TeacherSettings>(k: K, v: TeacherSettings[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const setUnit = (idx: number, patch: Partial<UnitData>) =>
    setDraft((d) => ({ ...d, units: d.units.map((u, i) => (i === idx ? { ...u, ...patch } : u)) }))

  const save = () => {
    if (unitErrors.length) {
      setMsg({ kind: 'hint', text: 'Tetapan tidak disimpan — betulkan ralat dalam Bank Soalan dahulu.' })
      setTab('soalan')
      return
    }
    if (!/^https:\/\//.test(draft.classroomUrl)) {
      setMsg({ kind: 'hint', text: 'Pautan Classroom mesti bermula dengan https://' })
      return
    }
    saveSettings(draft)
    onSave(draft)
    setMsg({ kind: 'ok', text: 'Tetapan disimpan dalam peranti ini.' })
  }

  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 400_000) {
      setMsg({ kind: 'hint', text: 'Logo terlalu besar (maksimum 400 KB).' })
      return
    }
    const r = new FileReader()
    r.onload = () => set('schoolLogo', String(r.result))
    r.readAsDataURL(f)
  }

  const onImport = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    f.text().then((t) => {
      const res = importSettingsJson(t)
      if (res.ok && res.settings) {
        setDraft(res.settings)
        setMsg({ kind: 'ok', text: 'JSON diimport. Tekan SIMPAN untuk menggunakan tetapan ini.' })
      } else setMsg({ kind: 'hint', text: 'Import gagal: ' + res.errors.slice(0, 5).join(' ') })
    })
    e.target.value = ''
  }

  const exportJson = () => {
    const blob = new Blob([exportSettingsJson(draft)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tetapan-galaksi-selawat.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const tabs: [Tab, string][] = [
    ['umum', 'Umum'],
    ['sijil', 'Sijil'],
    ['soalan', `Bank Soalan${unitErrors.length ? ' ⚠' : ''}`],
    ['json', 'Import/Eksport'],
    ['murid', 'Rekod Murid'],
  ]

  return (
    <div className="mx-auto max-w-4xl pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl text-gold-300">Mod Guru</h2>
        <div className="flex gap-2">
          <button type="button" className="btn-gold flex items-center gap-1 rounded-xl px-4 py-2" onClick={save} data-testid="teacher-save">
            <Save size={16} aria-hidden /> SIMPAN
          </button>
          <button type="button" className="btn-ghost rounded-xl px-4 py-2" onClick={onExit}>
            Keluar
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-xl border border-gold-400/40 bg-gold-400/10 p-3 text-sm text-gold-300">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          Tetapan guru disimpan <strong>setempat dalam pelayar peranti ini sahaja</strong> (localStorage). Ia bukan kawalan
          keselamatan berpusat: sesiapa yang menggunakan peranti ini boleh mengubah atau memadamnya. Gunakan Eksport JSON untuk
          menyimpan salinan dan Import JSON untuk memindahkan tetapan ke peranti lain.
        </p>
      </div>
      {msg && (
        <div className="mb-3">
          <Feedback kind={msg.kind}>{msg.text}</Feedback>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === id ? 'bg-gold-400 text-space-900' : 'bg-white/10'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6">
        {tab === 'umum' && (
          <div className="grid gap-4">
            <Field label="Nama sekolah">
              <input className={input} value={draft.schoolName} onChange={(e) => set('schoolName', e.target.value)} />
            </Field>
            <Field label="Logo sekolah (PNG/JPG, maks 400 KB)">
              <div className="flex items-center gap-3">
                {draft.schoolLogo && <img src={draft.schoolLogo} alt="Logo" className="h-14 w-14 rounded bg-white object-contain" />}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={onLogo} className="text-sm" />
                {draft.schoolLogo && (
                  <button type="button" className="btn-ghost rounded-lg px-3 py-1 text-sm" onClick={() => set('schoolLogo', null)}>
                    Buang
                  </button>
                )}
              </div>
            </Field>
            <Field label="Senarai kelas (satu kelas setiap baris)">
              <textarea
                className={`${input} h-28`}
                value={draft.classes.join('\n')}
                onChange={(e) => set('classes', e.target.value.split('\n').map((c) => c.trim()).filter(Boolean))}
              />
            </Field>
            <Field label="Pautan Google Classroom">
              <input className={input} value={draft.classroomUrl} onChange={(e) => set('classroomUrl', e.target.value.trim())} />
            </Field>
            <Field label="Arahan penghantaran">
              <textarea className={`${input} h-24`} value={draft.submissionText} onChange={(e) => set('submissionText', e.target.value)} />
            </Field>
            <Field label="Langkah penghantaran (satu langkah setiap baris)">
              <textarea
                className={`${input} h-48`}
                value={draft.submissionSteps.join('\n')}
                onChange={(e) => set('submissionSteps', e.target.value.split('\n').filter((s) => s.trim()))}
              />
            </Field>
            <Field label="PIN guru">
              <input className={input} value={draft.teacherPin} onChange={(e) => set('teacherPin', e.target.value)} />
            </Field>
          </div>
        )}

        {tab === 'sijil' && (
          <div className="grid gap-4">
            <Field label="Tajuk sijil">
              <input className={input} value={draft.certificate.title} onChange={(e) => set('certificate', { ...draft.certificate, title: e.target.value })} />
            </Field>
            <Field label="Anugerah">
              <input className={input} value={draft.certificate.award} onChange={(e) => set('certificate', { ...draft.certificate, award: e.target.value })} />
            </Field>
            <Field label="Nama penandatangan">
              <input
                className={input}
                value={draft.certificate.signatureName}
                onChange={(e) => set('certificate', { ...draft.certificate, signatureName: e.target.value })}
              />
            </Field>
            <Field label="Jawatan penandatangan">
              <input
                className={input}
                value={draft.certificate.signatureRole}
                onChange={(e) => set('certificate', { ...draft.certificate, signatureRole: e.target.value })}
              />
            </Field>
          </div>
        )}

        {tab === 'soalan' && (
          <div className="space-y-4">
            {unitErrors.length > 0 && (
              <Feedback kind="hint">
                <ul className="list-disc pl-5">
                  {unitErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Feedback>
            )}
            <p className="text-sm text-silver-400">
              Semak setiap lafaz dan maksud. Unit 11 dan 14 mempunyai lafaz yang sama tetapi ID berasingan. Mod "susun" sesuai untuk
              baris panjang.
            </p>
            {draft.units.map((u, i) => (
              <UnitEditor key={u.id} unit={u} onChange={(p) => setUnit(i, p)} />
            ))}
          </div>
        )}

        {tab === 'json' && (
          <div className="space-y-4">
            <p className="text-sm">Eksport semua tetapan (termasuk bank soalan) ke fail JSON, atau import fail JSON yang telah disemak.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-gold flex items-center gap-1 rounded-xl px-4 py-2" onClick={exportJson} data-testid="export-json">
                <Download size={16} aria-hidden /> Eksport JSON
              </button>
              <label className="btn-ghost flex cursor-pointer items-center gap-1 rounded-xl px-4 py-2">
                <Upload size={16} aria-hidden /> Import JSON
                <input type="file" accept="application/json,.json" className="hidden" onChange={onImport} data-testid="import-json" />
              </label>
              <button
                type="button"
                className="btn-ghost flex items-center gap-1 rounded-xl px-4 py-2"
                onClick={() => {
                  if (confirm('Kembalikan semua tetapan kepada lalai?')) {
                    const d = resetSettings()
                    setDraft(d)
                    onSave(d)
                    setMsg({ kind: 'ok', text: 'Tetapan lalai dipulihkan.' })
                  }
                }}
              >
                <RotateCcw size={16} aria-hidden /> Tetapan lalai
              </button>
            </div>
          </div>
        )}

        {tab === 'murid' && <StudentRecords />}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-silver-200">{label}</span>
      {children}
    </label>
  )
}

function UnitEditor({ unit, onChange }: { unit: UnitData; onChange: (p: Partial<UnitData>) => void }) {
  const words = splitWords(unit.arabic)
  return (
    <details className="rounded-xl border border-white/10 bg-white/5 p-3">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <span className="text-sm font-bold">
          Unit {unit.order} <span className="text-xs text-silver-400">({unit.id})</span>
        </span>
        <Arabic className="truncate text-xl">{unit.arabic}</Arabic>
      </summary>
      <div className="mt-3 grid gap-3">
        <Field label="Teks Arab (berharakat)">
          <textarea dir="rtl" lang="ar" className={`${input} arabic h-20 text-2xl`} value={unit.arabic} onChange={(e) => onChange({ arabic: e.target.value })} />
        </Field>
        <Field label="Maksud Bahasa Melayu">
          <textarea className={`${input} h-16`} value={unit.meaning} onChange={(e) => onChange({ meaning: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mod cabaran lafaz">
            <select className={input} value={unit.lafazMode} onChange={(e) => onChange({ lafazMode: e.target.value as LafazMode })}>
              <option value="blank">Isi tempat kosong (4 pilihan)</option>
              <option value="order">Susun kad perkataan</option>
            </select>
          </Field>
          {unit.lafazMode === 'blank' && (
            <Field label="Perkataan yang disembunyikan">
              <select className={`${input} arabic text-xl`} value={unit.blankIndex} onChange={(e) => onChange({ blankIndex: Number(e.target.value) })}>
                {words.map((w, i) => (
                  <option key={i} value={i}>
                    {i + 1}. {w}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        {unit.lafazMode === 'blank' && (
          <Field label="3 distraktor lafaz Arab (satu setiap baris)">
            <textarea
              dir="rtl"
              className={`${input} arabic h-28 text-xl`}
              value={unit.lafazDistractors.join('\n')}
              onChange={(e) => onChange({ lafazDistractors: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>
        )}
        <Field label="3 distraktor maksud (satu setiap baris)">
          <textarea
            className={`${input} h-24`}
            value={unit.meaningDistractors.join('\n')}
            onChange={(e) => onChange({ meaningDistractors: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Petunjuk lafaz">
            <input className={input} value={unit.lafazHint} onChange={(e) => onChange({ lafazHint: e.target.value })} />
          </Field>
          <Field label="Petunjuk maksud">
            <input className={input} value={unit.meaningHint} onChange={(e) => onChange({ meaningHint: e.target.value })} />
          </Field>
        </div>
      </div>
    </details>
  )
}

function StudentRecords() {
  const { settings } = useGame()
  const catalog = useMemo(() => buildCatalog(settings.units), [settings.units])
  const sessions = Object.values(loadSessions())
  if (sessions.length === 0) return <p className="text-sm text-silver-400">Tiada rekod murid dalam peranti ini.</p>
  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-xs text-silver-400">Rekod di bawah hanya untuk murid yang bermain di peranti ini.</p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-silver-400">
            <th className="py-1 pr-2">Nama</th>
            <th className="py-1 pr-2">Kelas</th>
            <th className="py-1 pr-2">XP</th>
            <th className="py-1 pr-2">Penguasaan</th>
            <th className="py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.key} className="border-t border-white/10">
              <td className="py-1 pr-2">{s.student.name}</td>
              <td className="py-1 pr-2">{s.student.className}</td>
              <td className="py-1 pr-2">{totalXp(s.progress)}</td>
              <td className="py-1 pr-2">{mastery(s.progress, catalog).percent}%</td>
              <td className="py-1">{isGameComplete(s.progress, catalog) ? 'Tamat' : 'Sedang bermain'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
