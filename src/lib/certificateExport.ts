import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import { CERT_H, CERT_W, PNG_H, PNG_W } from './certificate'

export async function renderCertificatePng(node: HTMLElement): Promise<string> {
  if (document.fonts?.ready) await document.fonts.ready
  const opts = {
    width: CERT_W,
    height: CERT_H,
    canvasWidth: PNG_W,
    canvasHeight: PNG_H,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: '#ffffff',
    style: { transform: 'none', margin: '0' },
  }
  // Panggilan pertama kadangkala belum memuatkan fon/imej sepenuhnya (isu html-to-image dikenali).
  await toPng(node, opts)
  return toPng(node, opts)
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function pngToPdfBlob(pngDataUrl: string): Blob {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  pdf.setProperties({ title: 'Sijil Pencapaian Digital — Galaksi Selawat', creator: 'Galaksi Selawat' })
  pdf.addImage(pngDataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST')
  return pdf.output('blob')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
