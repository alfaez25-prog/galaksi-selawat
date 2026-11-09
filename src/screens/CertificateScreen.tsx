import { useEffect, useRef, useState } from 'react'
import { Download, FileImage, Lock, Printer } from 'lucide-react'
import { useSession } from '../game'
import { Certificate, type CertificateData } from '../components/Certificate'
import { ClassroomGuide } from '../components/ClassroomGuide'
import { Feedback } from '../components/ui'
import { badgeFor, canGenerateCertificate, mastery, maxXpFor, totalXp } from '../lib/progress'
import { CERT_H, CERT_W, certificateFileName } from '../lib/certificate'

export function CertificateScreen() {
  const { session, progress, catalog, settings, go } = useSession()
  const certRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [busy, setBusy] = useState<null | 'pdf' | 'png'>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null)
  const allowed = canGenerateCertificate(progress, catalog)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / CERT_W))
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [allowed])

  if (!allowed) {
    return (
      <div className="glass mx-auto max-w-lg rounded-2xl p-6 text-center" data-testid="certificate-locked">
        <Lock className="mx-auto mb-2" aria-hidden />
        <h2 className="mb-2 font-display text-xl text-gold-300">Sijil Masih Dikunci</h2>
        <p>Sijil hanya boleh dijana selepas semua 34 cabaran (15 lafaz, 15 maksud, 3 orbit dan Final Galaxy) selesai.</p>
        <button type="button" className="btn-gold mt-4 rounded-xl px-5 py-2" onClick={() => go({ name: 'map' })}>
          Ke Peta
        </button>
      </div>
    )
  }

  const m = mastery(progress, catalog)
  const data: CertificateData = {
    name: session.student.name,
    className: session.student.className,
    xp: totalXp(progress),
    maxXp: maxXpFor(catalog),
    mastery: m.percent,
    completedAt: progress.completedAt ?? progress.final!.completedAt,
    badge: badgeFor(m.percent),
  }

  const exportFile = async (kind: 'pdf' | 'png') => {
    if (!certRef.current) return
    setBusy(kind)
    setMsg(null)
    try {
      const { renderCertificatePng, downloadDataUrl, downloadBlob, pngToPdfBlob } = await import('../lib/certificateExport')
      const png = await renderCertificatePng(certRef.current)
      if (kind === 'png') downloadDataUrl(png, certificateFileName(data.name, 'png'))
      else downloadBlob(pngToPdfBlob(png), certificateFileName(data.name, 'pdf'))
      setMsg({ kind: 'ok', text: `Sijil ${kind.toUpperCase()} telah dimuat turun. Semak folder Muat Turun anda, kemudian hantar ke Google Classroom.` })
    } catch (e) {
      console.error(e)
      setMsg({ kind: 'hint', text: 'Maaf, sijil gagal dijana. Sila cuba lagi atau gunakan butang CETAK SIJIL.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <h2 className="text-center font-display text-3xl text-gold-300">Sijil Pencapaian Digital</h2>

      <div ref={boxRef} className="w-full">
        <div
          id="certificate-print-root"
          className="mx-auto overflow-hidden rounded-xl shadow-[0_10px_50px_rgba(0,0,0,.6)]"
          style={{ width: CERT_W * scale, height: CERT_H * scale }}
        >
          <div className="cert-scale" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CERT_W, height: CERT_H }}>
            <Certificate ref={certRef} data={data} settings={settings} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" disabled={busy !== null} onClick={() => exportFile('pdf')} className="btn-gold flex items-center gap-2 rounded-2xl px-5 py-3" data-testid="download-pdf">
          <Download size={18} aria-hidden /> {busy === 'pdf' ? 'Menjana…' : 'MUAT TURUN PDF'}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => exportFile('png')} className="btn-gold flex items-center gap-2 rounded-2xl px-5 py-3" data-testid="download-png">
          <FileImage size={18} aria-hidden /> {busy === 'png' ? 'Menjana…' : 'MUAT TURUN PNG'}
        </button>
        <button type="button" onClick={() => window.print()} className="btn-ghost flex items-center gap-2 rounded-2xl px-5 py-3" data-testid="print-cert">
          <Printer size={18} aria-hidden /> CETAK SIJIL
        </button>
      </div>
      {msg && <Feedback kind={msg.kind}>{msg.text}</Feedback>}
      <p className="text-center text-xs text-silver-400">PDF: A4 landskap · PNG: 3508 × 2480 piksel (300 dpi). Kedua-dua fail dijana daripada imej yang sama.</p>

      <ClassroomGuide />
      <div className="text-center">
        <button type="button" className="text-sm text-silver-400 underline" onClick={() => go({ name: 'results' })}>
          ← Kembali ke analisis pencapaian
        </button>
      </div>
    </div>
  )
}
