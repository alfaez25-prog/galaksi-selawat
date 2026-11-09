import { ExternalLink, GraduationCap } from 'lucide-react'
import { useGame } from '../game'

export function ClassroomGuide({ compact = false }: { compact?: boolean }) {
  const { settings } = useGame()
  return (
    <section className="glass rounded-2xl p-4 sm:p-5" aria-labelledby="classroom-title">
      <h3 id="classroom-title" className="mb-2 flex items-center gap-2 font-display text-lg text-gold-300">
        <GraduationCap size={20} aria-hidden /> Penghantaran ke Google Classroom
      </h3>
      <p className="mb-3 text-sm text-silver-200 sm:text-base" data-testid="classroom-text">
        {settings.submissionText}
      </p>
      {!compact && (
        <ol className="mb-4 list-decimal space-y-1 pl-6 text-sm text-silver-200">
          {settings.submissionSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
      <a
        href={settings.classroomUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5"
        data-testid="classroom-button"
      >
        BUKA GOOGLE CLASSROOM <ExternalLink size={16} aria-hidden />
      </a>
      <p className="mt-3 text-xs text-silver-400">
        Nota: Permainan ini <strong>tidak</strong> menghantar fail secara automatik. Anda perlu memuat naik sijil sendiri dan
        menekan Serahkan di Google Classroom.
      </p>
    </section>
  )
}
