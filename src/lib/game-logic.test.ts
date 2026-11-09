import { describe, expect, it, beforeEach } from 'vitest'
import { DEFAULT_UNITS, buildOrbits } from '../data/units'
import { CLASSROOM_URL, createDefaultSettings } from '../data/settings'
import {
  buildCatalog,
  buildLafazChallenge,
  buildMeaningChallenge,
  checkSequence,
  splitWords,
  tokensOf,
  validateUnits,
} from './challenges'
import { makeResult, maxXp, xpFor } from './scoring'
import {
  canGenerateCertificate,
  emptyProgress,
  isFinalUnlocked,
  isGameComplete,
  isOrbitUnlocked,
  isStarUnlocked,
  mastery,
  maxXpFor,
  totalXp,
  type Progress,
} from './progress'
import { isRegistrationValid, validateClass, validateName } from './validation'
import {
  importSettingsJson,
  exportSettingsJson,
  loadActiveSession,
  loadSessions,
  saveSession,
  startSession,
  KEYS,
} from './storage'
import { certificateFileName, nameFontSize, PNG_H, PNG_W } from './certificate'
import { seeded } from './random'

const cat = buildCatalog(DEFAULT_UNITS)

/** Progress dengan semua cabaran selesai pada percubaan pertama */
function perfectProgress(): Progress {
  const p = emptyProgress()
  p.tutorialDone = true
  for (const u of cat.units) {
    p.lafaz[u.id] = makeResult('lafaz', 1)
    p.meaning[u.id] = makeResult('meaning', 1)
  }
  for (const o of cat.orbits) p.orbit[o.id] = makeResult('orbit', 1)
  p.final = makeResult('final', 1)
  p.completedAt = p.final.completedAt
  return p
}

/* ============ 1–2. Pendaftaran ============ */
describe('Pendaftaran murid', () => {
  it('nama wajib', () => {
    expect(validateName('')).toBeTruthy()
    expect(validateName('   ')).toBeTruthy()
    expect(validateName('Al')).toBeTruthy()
    expect(validateName('Nur Aisyah binti Ahmad')).toBeUndefined()
  })
  it('kelas wajib', () => {
    expect(validateClass('')).toBeTruthy()
    expect(validateClass('  ')).toBeTruthy()
    expect(validateClass('4 Amanah')).toBeUndefined()
  })
  it('hanya sah jika nama DAN kelas sah', () => {
    expect(isRegistrationValid('Ahmad Hakimi', '')).toBe(false)
    expect(isRegistrationValid('', '4 Amanah')).toBe(false)
    expect(isRegistrationValid('Ahmad Hakimi', '4 Amanah')).toBe(true)
  })
})

/* ============ Data ============ */
describe('Data bacaan', () => {
  it('mempunyai 15 unit lengkap dengan ID unik dan tertib 1–15', () => {
    expect(DEFAULT_UNITS).toHaveLength(15)
    expect(new Set(DEFAULT_UNITS.map((u) => u.id)).size).toBe(15)
    expect(DEFAULT_UNITS.map((u) => u.order)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
    expect(validateUnits(DEFAULT_UNITS)).toEqual([])
  })
  it('teks Arab berharakat (mengandungi tanda baris)', () => {
    for (const u of DEFAULT_UNITS) expect(/[ً-ْ]/.test(u.arabic)).toBe(true)
  })
  it('lafaz & maksud wajib sepadan dengan spesifikasi guru', () => {
    expect(DEFAULT_UNITS[0].arabic).toBe('التَّحِيَّاتُ الْمُبَارَكَاتُ الصَّلَوَاتُ الطَّيِّبَاتُ لِلَّهِ')
    expect(DEFAULT_UNITS[7].arabic).toBe('اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ')
    expect(DEFAULT_UNITS[14].meaning).toBe('Sesungguhnya Engkau Maha Terpuji lagi Maha Mulia di seluruh alam.')
  })
  it('unit berulang (11 & 14) mempunyai ID berasingan', () => {
    const u11 = DEFAULT_UNITS[10]
    const u14 = DEFAULT_UNITS[13]
    expect(u11.arabic).toBe(u14.arabic)
    expect(u11.id).not.toBe(u14.id)
  })
  it('perkataan berulang dalam satu baris mempunyai ID token unik', () => {
    const t = tokensOf(DEFAULT_UNITS[11])
    expect(new Set(t.map((x) => x.id)).size).toBe(t.length)
    expect(t.filter((x) => x.text === 'سَيِّدِنَا')).toHaveLength(2)
  })
})

/* ============ 3–5. Cabaran ============ */
describe('Cabaran lafaz (15)', () => {
  it.each(DEFAULT_UNITS.map((u) => [u.order, u] as const))('unit %i mempunyai cabaran lafaz yang sah', (_, u) => {
    const ch = buildLafazChallenge(u, seeded(u.order))
    if (ch.kind === 'blank') {
      expect(ch.options).toHaveLength(4)
      expect(new Set(ch.options).size).toBe(4)
      expect(ch.options).toContain(ch.answer)
      // jawapan tepat membentuk semula lafaz asal
      expect([...ch.before, ch.answer, ...ch.after].join(' ')).toBe(u.arabic)
    } else {
      expect(ch.tokens.map((t) => t.text).join(' ')).toBe(u.arabic)
      expect(ch.tokens.length).toBeGreaterThanOrEqual(3)
    }
  })
  it('baris panjang menggunakan kad susunan perkataan', () => {
    for (const u of DEFAULT_UNITS) {
      if (splitWords(u.arabic).length >= 6) expect(u.lafazMode, `unit ${u.order}`).toBe('order')
    }
  })
})

describe('Cabaran maksud (15)', () => {
  it.each(DEFAULT_UNITS.map((u) => [u.order, u] as const))('unit %i: 4 pilihan unik, 1 tepat', (_, u) => {
    const ch = buildMeaningChallenge(u, seeded(u.order * 7))
    expect(ch.question).toBe('Apakah maksud baris bacaan ini?')
    expect(ch.options).toHaveLength(4)
    expect(new Set(ch.options).size).toBe(4)
    expect(ch.options.filter((o) => o === u.meaning)).toHaveLength(1)
    expect(ch.answer).toBe(u.meaning)
  })
})

/* ============ 6–8. Orbit, Final & ID berulang ============ */
describe('Orbit & susunan', () => {
  const orbits = buildOrbits(DEFAULT_UNITS)
  const textOf = (id: string) => DEFAULT_UNITS.find((u) => u.id === id)!.arabic

  it('tiga orbit: unit 1–5, 6–10, 11–15', () => {
    expect(orbits).toHaveLength(3)
    expect(orbits.map((o) => o.unitIds.map((id) => DEFAULT_UNITS.find((u) => u.id === id)!.order))).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
    ])
  })
  it.each(orbits.map((o, i) => [i + 1, o] as const))('orbit %i: susunan betul diterima, salah ditolak', (_, o) => {
    expect(checkSequence(o.unitIds, o.unitIds, textOf).correct).toBe(true)
    const wrong = [...o.unitIds].reverse()
    expect(checkSequence(wrong, o.unitIds, textOf).correct).toBe(false)
    expect(checkSequence([o.unitIds[0], null, null, null, null], o.unitIds, textOf).complete).toBe(false)
  })
  it('Final Galaxy: 15 baris disemak', () => {
    const ids = cat.units.map((u) => u.id)
    expect(checkSequence(ids, ids, textOf).correct).toBe(true)
    const swapped = [...ids]
    ;[swapped[7], swapped[9]] = [swapped[9], swapped[7]]
    const r = checkSequence(swapped, ids, textOf)
    expect(r.correct).toBe(false)
    expect(r.correctCount).toBe(13)
  })
  it('unit berulang disemak berdasarkan ID: setiap ID mesti digunakan tepat sekali', () => {
    const ids = cat.units.map((u) => u.id)
    // ID unit 11 diletak dua kali (unit 14 tiada) — ditolak walaupun teksnya sama
    const dup = [...ids]
    dup[13] = ids[10]
    expect(checkSequence(dup, ids, textOf).correct).toBe(false)
    // pertukaran dua kad yang lafaznya serupa (11 ↔ 14) diterima kerana tidak dapat dibezakan murid
    const swap = [...ids]
    ;[swap[10], swap[13]] = [swap[13], swap[10]]
    expect(checkSequence(swap, ids, textOf).correct).toBe(true)
    // ID asing ditolak
    const foreign = [...ids]
    foreign[0] = 'bukan-id'
    expect(checkSequence(foreign, ids, (id) => (id === 'bukan-id' ? ids[0] : textOf(id))).correct).toBe(false)
  })
  it('jumlah cabaran = 34', () => {
    expect(cat.lafazCount).toBe(15)
    expect(cat.meaningCount).toBe(15)
    expect(cat.orbitCount).toBe(3)
    expect(cat.finalCount).toBe(1)
    expect(cat.total).toBe(34)
  })
})

/* ============ 9–10. Markah & Penguasaan ============ */
describe('Pemarkahan', () => {
  it('markah maksimum 2000 XP', () => {
    expect(maxXp(15, 3)).toBe(2000)
    expect(maxXpFor(cat)).toBe(2000)
    expect(totalXp(perfectProgress())).toBe(2000)
  })
  it('XP berkurang mengikut peraturan', () => {
    expect([1, 2, 3, 4, 9].map((a) => xpFor('lafaz', a))).toEqual([50, 30, 15, 5, 5])
    expect([1, 2, 3, 4].map((a) => xpFor('orbit', a))).toEqual([100, 70, 40, 20])
    expect([1, 2, 3, 4].map((a) => xpFor('final', a))).toEqual([200, 150, 100, 50])
    expect(xpFor('orbit', 1, 2)).toBe(80)
    expect(xpFor('final', 1, 3)).toBe(140)
    expect(xpFor('final', 4, 10)).toBe(20)
  })
  it('peratus penguasaan tepat dan berasingan daripada XP', () => {
    const p = perfectProgress()
    expect(mastery(p, cat).percent).toBe(100)
    // 4 lafaz dijawab pada percubaan ke-2
    cat.units.slice(0, 4).forEach((u) => (p.lafaz[u.id] = makeResult('lafaz', 2)))
    // final menggunakan 1 petunjuk
    p.final = makeResult('final', 1, 1)
    const m = mastery(p, cat)
    expect(m.firstTry).toBe(29)
    expect(m.percent).toBe(Math.round((29 / 34) * 1000) / 10) // 85.3
    expect(totalXp(p)).toBe(2000 - 4 * 20 - 20)
  })
})

/* ============ Kunci & aliran ============ */
describe('Aliran & kunci', () => {
  it('bintang dibuka mengikut tertib, tiada unit boleh dilangkau', () => {
    const p = emptyProgress()
    expect(isStarUnlocked(p, cat, cat.units[0].id)).toBe(false) // perlu tutorial
    p.tutorialDone = true
    expect(isStarUnlocked(p, cat, cat.units[0].id)).toBe(true)
    expect(isStarUnlocked(p, cat, cat.units[1].id)).toBe(false)
    p.lafaz[cat.units[0].id] = makeResult('lafaz', 1)
    expect(isStarUnlocked(p, cat, cat.units[1].id)).toBe(false) // maksud belum
    p.meaning[cat.units[0].id] = makeResult('meaning', 1)
    expect(isStarUnlocked(p, cat, cat.units[1].id)).toBe(true)
  })
  it('orbit & final dikunci sehingga syarat dipenuhi', () => {
    const p = perfectProgress()
    p.final = null
    delete p.orbit['orbit-3']
    expect(isFinalUnlocked(p, cat)).toBe(false)
    delete p.lafaz[cat.units[12].id]
    expect(isOrbitUnlocked(p, cat, 'orbit-3')).toBe(false)
    expect(isOrbitUnlocked(p, cat, 'orbit-1')).toBe(true)
  })
  it('sijil terkunci sebelum tamat (11)', () => {
    const p = perfectProgress()
    expect(canGenerateCertificate(p, cat)).toBe(true)
    p.final = null
    expect(canGenerateCertificate(p, cat)).toBe(false)
    const q = perfectProgress()
    delete q.meaning[cat.units[5].id]
    expect(isGameComplete(q, cat)).toBe(false)
    expect(canGenerateCertificate(emptyProgress(), cat)).toBe(false)
  })
})

/* ============ 16. Storan ============ */
describe('Kemajuan disimpan (localStorage)', () => {
  beforeEach(() => localStorage.clear())

  it('sesi disimpan dan dimuat semula', () => {
    const s = startSession({ name: 'Nur Aisyah binti Ahmad', className: '4 Amanah', avatar: 'bulan' })
    s.progress.lafaz['u01-tahiyyat'] = makeResult('lafaz', 1)
    saveSession(s)
    const loaded = loadActiveSession()
    expect(loaded?.student.name).toBe('Nur Aisyah binti Ahmad')
    expect(loaded?.progress.lafaz['u01-tahiyyat'].xp).toBe(50)
    expect(localStorage.getItem(KEYS.sessions)).toBeTruthy()
  })
  it('tukar nama → sesi baharu; keputusan tidak bercampur', () => {
    const a = startSession({ name: 'Ahmad Hakimi', className: '4 Amanah', avatar: 'roket' })
    a.progress.lafaz['u01-tahiyyat'] = makeResult('lafaz', 1)
    saveSession(a)
    const b = startSession({ name: 'Siti Hajar', className: '4 Amanah', avatar: 'bintang' })
    expect(b.key).not.toBe(a.key)
    expect(totalXp(b.progress)).toBe(0)
    expect(Object.keys(loadSessions())).toHaveLength(2)
    // murid A kembali → kemajuan A disambung
    const a2 = startSession({ name: '  ahmad   hakimi ', className: '4 amanah', avatar: 'roket' })
    expect(a2.key).toBe(a.key)
    expect(totalXp(a2.progress)).toBe(50)
  })
})

/* ============ Mod guru ============ */
describe('Import/Eksport JSON guru', () => {
  it('eksport → import pulang-balik', () => {
    const s = createDefaultSettings()
    s.schoolName = 'SK UJIAN'
    const r = importSettingsJson(exportSettingsJson(s))
    expect(r.ok).toBe(true)
    expect(r.settings?.schoolName).toBe('SK UJIAN')
    expect(r.settings?.units).toHaveLength(15)
  })
  it('menolak JSON tidak sah atau unit rosak', () => {
    expect(importSettingsJson('{bukan json').ok).toBe(false)
    const s = createDefaultSettings()
    s.units[1] = { ...s.units[1], lafazDistractors: ['عَلَيْكَ', 'x', 'y'] } // distraktor sama dengan jawapan
    expect(importSettingsJson(JSON.stringify(s)).ok).toBe(false)
    expect(importSettingsJson(JSON.stringify({ classroomUrl: 'http://contoh' })).ok).toBe(false)
  })
})

/* ============ Sijil ============ */
describe('Sijil', () => {
  it('saiz PNG 3508 × 2480', () => {
    expect([PNG_W, PNG_H]).toEqual([3508, 2480])
  })
  it('nama panjang dikecilkan supaya muat', () => {
    expect(nameFontSize('Ali bin Abu')).toBeGreaterThan(nameFontSize('Nur Aisyah Humaira binti Mohd Khairul Anuar Al-Hafiz'))
    expect(nameFontSize('A'.repeat(80))).toBeLessThanOrEqual(22)
  })
  it('nama fail selamat', () => {
    expect(certificateFileName('Nur Aisyah / Ahmad', 'pdf')).toBe('Sijil-Galaksi-Selawat-Nur-Aisyah-Ahmad.pdf')
  })
})

/* ============ 15. Classroom ============ */
describe('Google Classroom', () => {
  it('pautan lalai betul', () => {
    expect(CLASSROOM_URL).toBe('https://classroom.google.com/')
    expect(createDefaultSettings().classroomUrl).toBe('https://classroom.google.com/')
  })
})
