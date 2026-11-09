import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { KEYS } from './lib/storage'
import { DEFAULT_UNITS } from './data/units'
import { emptyProgress } from './lib/progress'
import { makeResult } from './lib/scoring'

beforeEach(() => {
  localStorage.clear()
  // jsdom tiada ResizeObserver / scrollTo
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
  window.scrollTo = () => {}
})

async function toRegister() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByTestId('opening-start'))
  return user
}

describe('UI pendaftaran', () => {
  it('butang MULA PENGEMBARAAN hanya aktif selepas nama dan kelas sah', async () => {
    const user = await toRegister()
    const btn = await screen.findByTestId('reg-submit')
    expect(btn).toBeDisabled()
    await user.type(screen.getByTestId('reg-name'), 'Nur Aisyah binti Ahmad')
    expect(btn).toBeDisabled()
    await user.type(screen.getByTestId('reg-class'), '4 Amanah')
    expect(btn).toBeEnabled()
    await user.clear(screen.getByTestId('reg-name'))
    expect(btn).toBeDisabled()
  })

  it('pendaftaran → tutorial → peta; nama dipaparkan pada dashboard', async () => {
    const user = await toRegister()
    await user.type(await screen.findByTestId('reg-name'), 'Ahmad Hakimi')
    await user.type(screen.getByTestId('reg-class'), '4 Bestari')
    await user.click(screen.getByTestId('reg-submit'))
    await user.click(await screen.findByTestId('tut-skip'))
    expect(await screen.findByTestId('star-map')).toBeInTheDocument()
    expect(screen.getByTestId('topbar-name')).toHaveTextContent('Ahmad Hakimi')
    expect(screen.getByTestId('topbar-progress')).toHaveTextContent('0/34')
    // bintang 1 dibuka, bintang 2 dikunci
    expect(screen.getByTestId('star-1')).toBeEnabled()
    expect(screen.getByTestId('star-2')).toBeDisabled()
    expect(screen.getByTestId('map-final')).toBeDisabled()
    // kemajuan disimpan
    expect(JSON.parse(localStorage.getItem(KEYS.sessions)!)).toBeTruthy()
  })
})

describe('Google Classroom', () => {
  it('butang membuka pautan betul di tab baharu', async () => {
    render(<App />)
    const link = screen.getByTestId('classroom-button')
    expect(link).toHaveAttribute('href', 'https://classroom.google.com/c/Nzg4MTkwMzYyNjg4?cjc=s4ii5xii')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(screen.getByTestId('classroom-text')).toHaveTextContent('lampirkan sijil dan tekan Serahkan')
  })
})

function seedSession(progressMutator: (p: ReturnType<typeof emptyProgress>) => void) {
  const p = emptyProgress()
  p.tutorialDone = true
  progressMutator(p)
  const key = 'NUR AISYAH HUMAIRA BINTI MOHD KHAIRUL ANUAR|4 AMANAH'
  localStorage.setItem(
    KEYS.sessions,
    JSON.stringify({
      [key]: {
        key,
        student: { name: 'Nur Aisyah Humaira binti Mohd Khairul Anuar', className: '4 Amanah', avatar: 'bulan' },
        startedAt: new Date().toISOString(),
        progress: p,
      },
    }),
  )
  localStorage.setItem(KEYS.active, JSON.stringify(key))
}

describe('Sijil', () => {
  it('terkunci sebelum tamat permainan', async () => {
    seedSession(() => {})
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('opening-start'))
    await user.click(await screen.findByTestId('reg-submit'))
    // cuba akses sijil melalui peta → tiada butang; skrin sijil dikunci
    expect(screen.queryByTestId('results-certificate')).toBeNull()
  })

  it('nama, kelas, markah dan penguasaan tepat pada sijil selepas tamat', async () => {
    seedSession((p) => {
      DEFAULT_UNITS.forEach((u, i) => {
        p.lafaz[u.id] = makeResult('lafaz', i === 0 ? 2 : 1)
        p.meaning[u.id] = makeResult('meaning', 1)
      })
      ;['orbit-1', 'orbit-2', 'orbit-3'].forEach((o) => (p.orbit[o] = makeResult('orbit', 1)))
      p.final = makeResult('final', 1)
      p.completedAt = p.final.completedAt
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('opening-start'))
    await user.click(await screen.findByTestId('reg-submit'))
    await user.click(await screen.findByTestId('map-continue'))
    expect(await screen.findByTestId('results-xp')).toHaveTextContent('1980 / 2000')
    expect(screen.getByTestId('results-mastery')).toHaveTextContent('97.1%')
    await user.click(screen.getByTestId('results-certificate'))
    const cert = await screen.findByTestId('certificate')
    expect(within(cert).getByTestId('cert-name')).toHaveTextContent('Nur Aisyah Humaira binti Mohd Khairul Anuar')
    expect(within(cert).getByTestId('cert-class')).toHaveTextContent('4 Amanah')
    expect(within(cert).getByTestId('cert-xp')).toHaveTextContent('1980 / 2000')
    expect(within(cert).getByTestId('cert-mastery')).toHaveTextContent('97.1%')
    expect(within(cert).getByTestId('cert-school')).toHaveTextContent('SK BUKIT MINYAK')
    expect(cert).toHaveTextContent('SIJIL PENCAPAIAN DIGITAL')
    expect(cert).toHaveTextContent('JUARA GALAKSI SELAWAT')
    expect(screen.getByTestId('download-pdf')).toBeInTheDocument()
    expect(screen.getByTestId('download-png')).toBeInTheDocument()
    expect(screen.getByTestId('print-cert')).toBeInTheDocument()
  })
})
