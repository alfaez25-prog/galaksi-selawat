import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GameContext, type GameCtx, type Screen } from './game'
import { buildCatalog } from './lib/challenges'
import { loadActiveSession, loadMuted, saveMuted, saveSession } from './lib/storage'
import { createDefaultSettings } from './data/settings'
import { play, setMuted as setAudioMuted, type SoundName } from './lib/audio'
import type { Progress, Session } from './lib/progress'
import { Starfield } from './components/ui'
import { TopBar } from './components/TopBar'
import { OpeningScreen } from './screens/OpeningScreen'
import { RegistrationScreen } from './screens/RegistrationScreen'
import { TutorialScreen } from './screens/TutorialScreen'
import { StarMapScreen } from './screens/StarMapScreen'
import { StarChallengeScreen } from './screens/StarChallengeScreen'
import { OrbitScreen } from './screens/OrbitScreen'
import { FinalGalaxyScreen } from './screens/FinalGalaxyScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { CertificateScreen } from './screens/CertificateScreen'

export default function App() {
  const [settings] = useState(createDefaultSettings)
  const [session, setSession] = useState<Session | null>(() => loadActiveSession())
  const [screen, setScreen] = useState<Screen>({ name: 'opening' })
  const [muted, setMuted] = useState<boolean>(() => loadMuted())

  const catalog = useMemo(() => buildCatalog(settings.units), [settings.units])

  useEffect(() => {
    setAudioMuted(muted)
    saveMuted(muted)
  }, [muted])

  const setProgress = useCallback((fn: (p: Progress) => Progress) => {
    setSession((s) => {
      if (!s) return s
      const next = { ...s, progress: fn(s.progress) }
      saveSession(next)
      return next
    })
  }, [])

  const go = useCallback((s: Screen) => {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  const sfx = useCallback((s: SoundName) => play(s), [])

  const ctx: GameCtx = { settings, catalog, session, setProgress, sfx, go }

  // Pengawal laluan: skrin permainan memerlukan sesi murid
  const needsSession = !['opening', 'register'].includes(screen.name)
  const effective: Screen = needsSession && !session ? { name: 'register' } : screen

  const showBar = session && !['opening', 'register'].includes(effective.name)

  return (
    <GameContext.Provider value={ctx}>
      <Starfield />
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-10">
        {showBar && <TopBar muted={muted} onToggleMute={() => setMuted((m) => !m)} />}
        <AnimatePresence mode="wait">
          <motion.main
            key={effective.name + ('unitId' in effective ? effective.unitId : '') + ('orbitId' in effective ? effective.orbitId : '')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            {effective.name === 'opening' && (
              <OpeningScreen muted={muted} onToggleMute={() => setMuted((m) => !m)} hasSession={Boolean(session)} />
            )}
            {effective.name === 'register' && (
              <RegistrationScreen
                onRegistered={(s) => {
                  setSession(s)
                  go(s.progress.tutorialDone ? { name: 'map' } : { name: 'tutorial' })
                }}
              />
            )}
            {effective.name === 'tutorial' && <TutorialScreen />}
            {effective.name === 'map' && <StarMapScreen />}
            {effective.name === 'star' && <StarChallengeScreen unitId={effective.unitId} />}
            {effective.name === 'orbit' && <OrbitScreen orbitId={effective.orbitId} />}
            {effective.name === 'final' && <FinalGalaxyScreen />}
            {effective.name === 'results' && <ResultsScreen />}
            {effective.name === 'certificate' && <CertificateScreen />}
          </motion.main>
        </AnimatePresence>
        <footer className="mt-8 text-center text-xs text-silver-400/70">
          {settings.schoolName} · Pendidikan Islam Tahun 4 · Galaksi Selawat: Misi Tahiyat Akhir
        </footer>
      </div>
    </GameContext.Provider>
  )
}
