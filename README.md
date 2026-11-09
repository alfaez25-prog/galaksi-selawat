# GALAKSI SELAWAT — Misi Tahiyat Akhir

Permainan digital interaktif Pendidikan Islam Tahun 4 · SK BUKIT MINYAK · Bahasa Melayu.

## Main dalam talian

https://alfaez25-prog.github.io/galaksi-selawat/ (diterbitkan automatik oleh GitHub Actions setiap kali `main` dikemas kini).

## Cara menjalankan

```bash
npm install
npm run dev        # pelayan pembangunan → http://localhost:5173
npm test           # ujian unit & komponen (Vitest)
npm run build      # production build → folder dist/
npm run preview    # pratonton build
npm run e2e        # ujian E2E penuh (selepas build; memerlukan Playwright + Chromium)
```

Folder `dist/` ialah laman statik (`base: './'`) — boleh dibuka melalui mana-mana pelayan statik
(GitHub Pages, Netlify, Google Sites embed, pelayan sekolah). Fon dibundel secara setempat; tiada CDN diperlukan.

## Aliran

Pembukaan → Pendaftaran (nama + kelas wajib, avatar) → Tutorial interaktif → Peta 15 bintang →
Fasa 1 Lafaz (15) → Fasa 2 Maksud (15) → 3 Orbit → Final Galaxy → Analisis → Sijil PDF/PNG → Google Classroom.

Jumlah: 15 + 15 + 3 + 1 = **34 cabaran**, maksimum **2000 XP**.

## Peraturan XP

| Cabaran | Percubaan 1 | 2 | 3 | 4+ | Petunjuk |
|---|---|---|---|---|---|
| Lafaz / Maksud | 50 | 30 | 15 | 5 | – |
| Orbit | 100 | 70 | 40 | 20 | −10 setiap satu (min 10) |
| Final Galaxy | 200 | 150 | 100 | 50 | −20 setiap satu (min 20) |

**Peratus penguasaan** (berasingan daripada XP) = cabaran betul pada percubaan pertama tanpa petunjuk ÷ 34 × 100.

## Struktur kod

```
src/data/units.ts            15 unit bacaan (lafaz, maksud, distraktor, petunjuk) — SEMAK GURU
src/data/settings.ts         Tetapan lalai (sekolah, kelas, Classroom, sijil)
src/lib/challenges.ts        Penjana cabaran, semakan susunan berasaskan ID, validasi bank soalan
src/lib/scoring.ts           Peraturan XP
src/lib/progress.ts          Kunci/aliran, penguasaan, lencana
src/lib/storage.ts           localStorage (sesi per murid, tetapan guru, import/eksport JSON)
src/lib/certificateExport.ts html-to-image → PNG 3508×2480, jsPDF → A4 landskap
src/components/              UI dikongsi, papan susunan (seret + ketik), sijil
src/screens/                 Setiap skrin permainan + Mod Guru
e2e/playthrough.mjs          Ujian E2E penuh (desktop + iPhone 13)
```

## Mod Guru

Butang "Mod Guru" di skrin pembukaan (PIN lalai `1234`). Tetapan: nama & logo sekolah, senarai kelas,
teks Arab, maksud, bank soalan (mod lafaz, perkataan disembunyikan, distraktor, petunjuk), pautan Classroom,
arahan penghantaran, tetapan sijil, import/eksport JSON, rekod murid pada peranti.

> Tetapan guru disimpan setempat dalam pelayar (localStorage). Ia **bukan** kawalan keselamatan berpusat.

## Nota reka bentuk

- Unit 11 dan 14 mempunyai lafaz yang sama tetapi ID berasingan (`u11-…`, `u14-…`). Semakan susunan
  menggunakan ID (setiap ID mesti digunakan tepat sekali); dua kad berlafaz serupa yang ditukar tempat
  dianggap betul kerana murid tidak dapat membezakannya.
- Audio bacaan Arab tidak disertakan. Hanya kesan bunyi disintesis (Web Audio) digunakan, dengan butang senyap.
- Permainan tidak menghantar fail ke Google Classroom secara automatik.
