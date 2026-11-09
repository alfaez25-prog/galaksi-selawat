export interface RegistrationErrors {
  name?: string
  className?: string
}

export const NAME_MIN = 3
export const NAME_MAX = 80

export function validateName(name: string): string | undefined {
  const n = name.trim().replace(/\s+/g, ' ')
  if (!n) return 'Nama penuh wajib diisi.'
  if (n.length < NAME_MIN) return `Nama mesti sekurang-kurangnya ${NAME_MIN} huruf.`
  if (n.length > NAME_MAX) return `Nama tidak boleh melebihi ${NAME_MAX} aksara.`
  if (!/\p{L}/u.test(n)) return 'Nama mesti mengandungi huruf.'
  if (/[<>{}]/.test(n)) return 'Nama mengandungi aksara yang tidak dibenarkan.'
  return undefined
}

export function validateClass(className: string): string | undefined {
  const c = className.trim()
  if (!c) return 'Kelas wajib diisi.'
  if (c.length > 30) return 'Nama kelas terlalu panjang.'
  if (/[<>{}]/.test(c)) return 'Kelas mengandungi aksara yang tidak dibenarkan.'
  return undefined
}

export function validateRegistration(name: string, className: string): RegistrationErrors {
  const errors: RegistrationErrors = {}
  const ne = validateName(name)
  const ce = validateClass(className)
  if (ne) errors.name = ne
  if (ce) errors.className = ce
  return errors
}

export function isRegistrationValid(name: string, className: string): boolean {
  const e = validateRegistration(name, className)
  return !e.name && !e.className
}
