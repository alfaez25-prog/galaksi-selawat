/** Saiz reka bentuk sijil (A4 landskap pada 96 dpi). */
export const CERT_W = 1123
export const CERT_H = 794
/** Saiz PNG cetakan tinggi (A4 landskap 300 dpi). */
export const PNG_W = 3508
export const PNG_H = 2480

export function certificateFileName(name: string, ext: 'pdf' | 'png'): string {
  const safe = name
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `Sijil-Galaksi-Selawat-${safe || 'Murid'}.${ext}`
}

/** Saiz fon nama dikecilkan secara automatik supaya nama panjang muat. */
export function nameFontSize(name: string): number {
  const len = name.trim().length
  if (len <= 18) return 52
  if (len <= 26) return 44
  if (len <= 34) return 38
  if (len <= 44) return 32
  if (len <= 56) return 26
  return 22
}

export function formatDateMs(iso: string): string {
  const d = new Date(iso)
  const months = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

