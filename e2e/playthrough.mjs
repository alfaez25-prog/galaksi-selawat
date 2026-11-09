// Ujian E2E penuh: Pendaftaran → Tutorial → 15 Bintang → 3 Orbit → Final → Keputusan → Sijil PDF/PNG → Classroom
// Jalankan: npm run build && npm run e2e   (memerlukan Playwright + Chromium)
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_UNITS } from '../src/data/units.ts'

const require = createRequire(import.meta.url)
const { chromium, devices } = require('playwright')

const OUT = process.env.E2E_OUT ?? 'e2e-output'
mkdirSync(OUT, { recursive: true })
const PORT = 4179
const BASE = `http://localhost:${PORT}/`
const units = [...DEFAULT_UNITS].sort((a, b) => a.order - b.order)
const orbits = [units.slice(0, 5), units.slice(5, 10), units.slice(10, 15)]

let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? '✔' : '✘'} ${msg}`)
  if (!cond) failures++
}

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => d.toString().includes(String(PORT)) && res())
  server.on('exit', rej)
  setTimeout(res, 6000)
})

async function play(label, contextOpts, { useDrag = false, wrongOnce = true } = {}) {
  console.log(`\n=== ${label} ===`)
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ ...contextOpts, acceptDownloads: true })
  // Bekas ujian tiada internet: pintas Classroom supaya URL sebenar yang diminta boleh disahkan
  await ctx.route('https://classroom.google.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>Classroom stub</title>' }))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const shot = (n) => page.screenshot({ path: join(OUT, `${label}-${n}.png`), fullPage: false })

  await page.goto(BASE)
  await shot('01-opening')
  ok((await page.getByTestId('classroom-button').getAttribute('href')) === 'https://classroom.google.com/', 'Butang Classroom pada skrin mula → pautan betul')
  await page.getByTestId('opening-start').click()

  // Pendaftaran
  const submit = page.getByTestId('reg-submit')
  ok(await submit.isDisabled(), 'MULA PENGEMBARAAN dinyahaktif tanpa nama/kelas')
  const NAME = 'Nur Aisyah Humaira binti Mohd Khairul Anuar'
  await page.getByTestId('reg-name').fill(NAME)
  ok(await submit.isDisabled(), 'Masih dinyahaktif tanpa kelas')
  await page.getByTestId('reg-class').fill('4 Amanah')
  ok(await submit.isEnabled(), 'Aktif selepas nama & kelas sah')
  await shot('02-register')
  await submit.click()

  // Tutorial
  await page.getByTestId('tut-star').click()
  await page.getByTestId('tut-next').click()
  await page.locator('[data-testid="tut-option"]').first().click()
  await page.getByTestId('tut-next').click()
  for (const c of ['Pertama', 'Kedua', 'Ketiga']) await page.getByRole('button', { name: c, exact: true }).click()
  await page.getByTestId('tut-next').click()
  await page.getByTestId('tut-finish').click()
  await page.getByTestId('star-map').waitFor()
  await shot('03-map')

  const continueIfOnMap = async () => {
    await page.waitForTimeout(400)
    if (await page.getByTestId('map-continue').isVisible().catch(() => false)) await page.getByTestId('map-continue').click()
  }

  const placeInOrder = async (prefix, texts) => {
    for (const t of texts) {
      await page.locator(`[data-testid="${prefix}-pool"] [data-text="${t}"]`).first().click()
    }
  }

  // 15 bintang
  for (const u of units) {
    await continueIfOnMap()
    await page.getByTestId('star-title').waitFor()
    await page.waitForTimeout(300)
    ok((await page.getByTestId('star-title').textContent()).includes(`Bintang ${u.order} `), `Bintang ${u.order} dibuka mengikut tertib`)
    // FASA 1
    if (u.lafazMode === 'blank') {
      await page.getByTestId('lafaz-blank').waitFor()
      const words = u.arabic.split(/\s+/)
      const answer = words[u.blankIndex]
      if (wrongOnce && u.order === 2) {
        await page.locator(`[data-testid="lafaz-option"][data-text="${u.lafazDistractors[0]}"]`).click()
        await page.getByText('Petunjuk:').waitFor()
        ok(true, 'Jawapan salah → petunjuk dipaparkan & boleh cuba semula')
        await shot('04-hint')
      }
      if (u.order === 3) await shot('04b-blank')
      await page.locator(`[data-testid="lafaz-option"][data-text="${answer}"]`).click()
    } else {
      await page.getByTestId('lafaz-order').waitFor()
      await placeInOrder('word', u.arabic.split(/\s+/))
      if (u.order === 12) await shot('05-word-order')
      await page.getByTestId('word-check').click()
    }
    // FASA 2
    await page.getByTestId('meaning').waitFor({ timeout: 5000 })
    if (u.order === 8) await shot('06-meaning')
    await page.locator(`[data-testid="meaning-option"][data-text="${u.meaning}"]`).click()
    await page.getByTestId('star-done').waitFor({ timeout: 5000 })
    await page.getByTestId('star-next').click()

    if (u.order === 5) {
      // Semak kemajuan disimpan selepas muat semula
      await page.reload()
      await page.getByTestId('opening-start').click()
      await page.getByTestId('reg-submit').click()
      await page.getByTestId('star-map').waitFor()
      ok((await page.getByTestId('topbar-progress').textContent()) === '10/34', 'Kemajuan disimpan selepas muat semula (10/34)')
    }
  }
  await page.getByTestId('orbit-title').waitFor()
  await page.getByRole('button', { name: '← Peta' }).click()
  await page.getByTestId('star-map').waitFor()
  await shot('07-map-lit')
  ok(await page.getByTestId('map-final').isDisabled(), 'Final dikunci sebelum orbit selesai')

  // 3 orbit
  for (let i = 0; i < 3; i++) {
    await continueIfOnMap()
    await page.getByTestId('orbit-title').waitFor()
    await page.waitForTimeout(300)
    if (useDrag && i === 0) {
      // Uji seret-dan-lepas sebenar (HTML5 DnD)
      for (let s = 0; s < 5; s++) {
        const card = page.locator(`[data-testid="orbit-pool"] [data-text="${orbits[i][s].arabic}"]`).first()
        await card.dragTo(page.getByTestId(`orbit-slot-${s}`))
      }
      const filled = await page.locator('[data-testid="orbit-slots"] [data-testid="orbit-card"]').count()
      ok(filled === 5, 'Seret-dan-lepas meletakkan 5 kad ke slot orbit')
    } else {
      // Satu semakan salah dahulu pada orbit 2 untuk menguji petunjuk
      if (i === 1) {
        await placeInOrder('orbit', [...orbits[i]].reverse().map((u) => u.arabic))
        await page.getByTestId('orbit-check').click()
        await page.getByText('kedudukan betul').waitFor()
        ok(true, 'Orbit: susunan salah ditolak dengan maklum balas')
        await page.getByTestId('orbit-retry').click()
      }
      await placeInOrder('orbit', orbits[i].map((u) => u.arabic))
    }
    if (i === 2) await shot('08-orbit')
    await page.getByTestId('orbit-check').click()
    await page.getByTestId('orbit-done').waitFor({ timeout: 6000 })
    ok(true, `Orbit ${i + 1} berjaya disambung`)
    if (i === 0) await shot('09-orbit-done')
    await page.getByTestId('orbit-next').click()
  }

  // Final Galaxy
  await continueIfOnMap()
  await page.getByTestId('final-check').waitFor()
  ok(await page.getByTestId('final-check').isDisabled(), 'SEMAK SUSUNAN dinyahaktif sebelum semua slot diisi')
  await page.getByTestId('final-hint').click()
  ok((await page.locator('[data-testid="final-slot-0"] [data-testid="final-card"]').getAttribute('data-text')) === units[0].arabic, 'PETUNJUK meletakkan kad betul pada slot 1')
  await placeInOrder('final', units.slice(1).map((u) => u.arabic))
  await shot('10-final')
  await page.getByTestId('final-check').click()
  await page.getByTestId('final-done').waitFor({ timeout: 8000 })
  await shot('11-perfect-galaxy')
  await page.getByTestId('final-results').click()

  // Keputusan
  const xpText = await page.getByTestId('results-xp').textContent()
  const mastText = await page.getByTestId('results-mastery').textContent()
  // Jangkaan: unit 2 lafaz percubaan ke-2 (−20), orbit 2 semakan ke-2 (−30), final 1 petunjuk (−20)
  const expXp = wrongOnce ? 2000 - 20 - 30 - 20 : 2000 - 30 - 20
  const expFirst = wrongOnce ? 31 : 32
  ok(xpText.trim() === `${expXp} / 2000`, `Markah tepat: ${xpText}`)
  ok(mastText.trim() === `${Math.round((expFirst / 34) * 1000) / 10}%`, `Peratus penguasaan tepat: ${mastText}`)
  await shot('12-results')

  // Sijil
  await page.getByTestId('results-certificate').click()
  await page.getByTestId('certificate').waitFor()
  ok((await page.getByTestId('cert-name').textContent()) === NAME, 'Nama tepat pada sijil')
  ok((await page.getByTestId('cert-class').textContent()).includes('4 Amanah'), 'Kelas tepat pada sijil')
  const nameBox = await page.getByTestId('cert-name').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, h: el.clientHeight }))
  ok(nameBox.sw <= nameBox.cw + 1, 'Nama panjang muat dalam sijil')
  const certOverflow = await page.getByTestId('certificate').evaluate((el) => {
    const r = el.getBoundingClientRect()
    return [...el.querySelectorAll('*')].some((c) => {
      const b = c.getBoundingClientRect()
      return b.width > 0 && (b.right > r.right + 1 || b.bottom > r.bottom + 1 || b.left < r.left - 1)
    })
  })
  ok(!certOverflow, 'Tiada elemen sijil terpotong')
  await shot('13-certificate')

  const [pngDl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.getByTestId('download-png').click()])
  const pngPath = join(OUT, `${label}-${pngDl.suggestedFilename()}`)
  await pngDl.saveAs(pngPath)
  const png = readFileSync(pngPath)
  const w = png.readUInt32BE(16)
  const h = png.readUInt32BE(20)
  ok(png.subarray(1, 4).toString() === 'PNG' && w === 3508 && h === 2480, `PNG sah ${w}×${h} (${(png.length / 1e6).toFixed(2)} MB)`)

  const [pdfDl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.getByTestId('download-pdf').click()])
  const pdfPath = join(OUT, `${label}-${pdfDl.suggestedFilename()}`)
  await pdfDl.saveAs(pdfPath)
  const pdf = readFileSync(pdfPath)
  const pdfStr = pdf.toString('latin1')
  const mb = pdfStr.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/)
  ok(pdf.subarray(0, 5).toString() === '%PDF-' && pdfStr.includes('%%EOF') && statSync(pdfPath).size > 50000, `PDF sah (${(pdf.length / 1e6).toFixed(2)} MB)`)
  ok(mb && Math.round(+mb[1]) === 842 && Math.round(+mb[2]) === 595, `PDF A4 landskap (MediaBox ${mb?.[1]}×${mb?.[2]} pt)`)

  ok((await page.getByTestId('classroom-button').getAttribute('href')) === 'https://classroom.google.com/', 'Butang Classroom pada skrin tamat → pautan betul')
  const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 10000 }).catch(() => null), page.getByTestId('classroom-button').click()])
  ok(popup !== null, 'Butang Classroom membuka tab baharu')
  if (popup) {
    await popup.waitForLoadState().catch(() => {})
    ok(popup.url() === 'https://classroom.google.com/', `Tab baharu menuju: ${popup.url()}`)
    await popup.close()
  }

  // Paparan telefon: tiada skrol mendatar
  const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  ok(!hOverflow, 'Tiada skrol mendatar')
  ok(errors.length === 0, `Tiada ralat konsol${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`)
  await browser.close()
  return { pngPath, pdfPath }
}

try {
  await play('desktop', { viewport: { width: 1280, height: 860 } }, { useDrag: true })
  await play('mobile', { ...devices['iPhone 13'] }, { wrongOnce: true })
} catch (e) {
  console.error(e)
  failures++
} finally {
  server.kill()
}
console.log(failures ? `\n${failures} SEMAKAN GAGAL` : '\nSEMUA SEMAKAN E2E LULUS')
process.exit(failures ? 1 : 0)
