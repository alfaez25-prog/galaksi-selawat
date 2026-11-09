import type { GameSettings } from './types'
import { DEFAULT_UNITS } from './units'
import logoSekolah from '../assets/logo-sekolah.png?inline'

/** Pautan kelas Pendidikan Islam di Google Classroom */
export const CLASSROOM_URL = 'https://classroom.google.com/c/Nzg4MTkwMzYyNjg4?cjc=s4ii5xii'

export const SUBMISSION_TEXT =
  'Selepas tamat permainan, muat turun sijil pencapaian anda. Kemudian buka Google Classroom, pilih tugasan Pendidikan Islam, lampirkan sijil dan tekan Serahkan.'

export const SUBMISSION_STEPS = [
  'Selesaikan semua cabaran.',
  'Muat turun sijil PDF atau PNG.',
  'Buka Google Classroom.',
  'Pilih kelas Pendidikan Islam.',
  'Buka tugasan yang diberikan oleh guru.',
  'Tekan Tambah atau cipta.',
  'Muat naik sijil.',
  'Tekan Serahkan.',
  'Pastikan status tugasan telah diserahkan.',
]

export function createDefaultSettings(): GameSettings {
  return {
    version: 1,
    schoolName: 'SK BUKIT MINYAK',
    schoolLogo: logoSekolah,
    classes: ['4 Amanah', '4 Bestari', '4 Cemerlang', '4 Dedikasi'],
    classroomUrl: CLASSROOM_URL,
    submissionText: SUBMISSION_TEXT,
    submissionSteps: [...SUBMISSION_STEPS],
    certificate: {
      title: 'SIJIL PENCAPAIAN DIGITAL',
      award: 'JUARA GALAKSI SELAWAT',
      signatureName: 'Guru Pendidikan Islam',
      signatureRole: 'Panitia Pendidikan Islam',
    },
    units: DEFAULT_UNITS.map((u) => ({
      ...u,
      lafazDistractors: [...u.lafazDistractors],
      meaningDistractors: [...u.meaningDistractors],
    })),
  }
}
