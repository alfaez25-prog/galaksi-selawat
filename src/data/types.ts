export type LafazMode = 'blank' | 'order'

/** Satu unit bacaan tahiyat akhir (boleh disunting guru). */
export interface UnitData {
  /** ID unik — wajib unik walaupun lafaz berulang (cth. unit 11 dan 14). */
  id: string
  /** Nombor tertib 1..15 */
  order: number
  arabic: string
  meaning: string
  /** blank = isi tempat kosong (4 pilihan), order = susun kad perkataan */
  lafazMode: LafazMode
  /** Indeks perkataan (dipisah ruang) yang disembunyikan untuk mod blank */
  blankIndex: number
  /** 3 distraktor Arab untuk mod blank */
  lafazDistractors: string[]
  /** 3 distraktor maksud Bahasa Melayu */
  meaningDistractors: string[]
  lafazHint: string
  meaningHint: string
}

export interface OrbitDef {
  id: string
  name: string
  unitIds: string[]
}

export interface CertificateSettings {
  title: string
  award: string
  signatureName: string
  signatureRole: string
}

export interface TeacherSettings {
  version: 1
  schoolName: string
  schoolLogo: string | null
  classes: string[]
  classroomUrl: string
  submissionText: string
  submissionSteps: string[]
  certificate: CertificateSettings
  units: UnitData[]
  teacherPin: string
}
