import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoginOverlay from './components/LoginOverlay.jsx'
import RaceScreen from './components/RaceScreen.jsx'
import {
  loadPlayerName, savePlayerName, clearPlayerName,
  fetchProgress, pushProgress, applyRemoteProfile,
  loadLocalGameState, saveLocalGameState, defaultGameState,
} from './engine/sync.js'

export default function App() {
  const [playerName,    setPlayerName]    = useState(() => loadPlayerName())
  const [gameState,     setGameState]     = useState(() => loadLocalGameState())
  const [globalMastery, setGlobalMastery] = useState({})
  const [loginLoading,  setLoginLoading]  = useState(false)
  const [screen,        setScreen]        = useState('dashboard') // 'dashboard' | 'race'
  const [syncStatus,    setSyncStatus]    = useState(null)
  const [lastResult,    setLastResult]    = useState(null)

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLogin(name) {
    setLoginLoading(true)
    try {
      const { exists, data } = await fetchProgress(name)
      if (exists && data) {
        applyRemoteProfile(data)
        const gs = data.game_states?.lego_racing ?? defaultGameState()
        setGameState(gs); saveLocalGameState(gs)
        setGlobalMastery(data.global_math_mastery ?? {})
      } else {
        const fresh = defaultGameState()
        await pushProgress(name, fresh)
        setGameState(fresh); saveLocalGameState(fresh)
      }
      savePlayerName(name); setPlayerName(name)
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Save progress ─────────────────────────────────────────────────────────
  async function saveProgress(newState, masteryDelta = {}) {
    setSyncStatus('saving')
    setGameState(newState); saveLocalGameState(newState)
    try {
      await pushProgress(playerName, newState, masteryDelta)
      setSyncStatus('saved')
      setTimeout(() => setSyncStatus(null), 2000)
    } catch { setSyncStatus('error') }
  }

  // ── Race complete ─────────────────────────────────────────────────────────
  function handleRaceComplete({ position, coinsEarned = 0, updatedMastery = {}, replay = false }) {
    setScreen('dashboard')
    if (!replay) {
      setLastResult({ position, coinsEarned })
      // Merge updated mastery locally so next race starts with correct ZPD
      if (Object.keys(updatedMastery).length > 0) {
        setGlobalMastery(prev => ({ ...prev, ...updatedMastery }))
      }
      const updated = { ...gameState, earned_coins: (gameState.earned_coins ?? 0) + coinsEarned }
      saveProgress(updated, updatedMastery)
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function handleLogout() {
    if (!window.confirm('Switch racer?')) return
    clearPlayerName(); setPlayerName(null)
    setGameState(defaultGameState()); setScreen('dashboard')
  }

  // ── Race screen (full-screen, no outer padding) ───────────────────────────
  if (playerName && screen === 'race') {
    return (
      <RaceScreen
        playerName={playerName}
        gameState={gameState}
        globalMastery={globalMastery}
        onRaceComplete={handleRaceComplete}
      />
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const firstName = playerName ? playerName.trim().split(' ')[0] : 'Racer'

  return (
    <div className="min-h-screen flex flex-col items-center"
      style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #1a0a00 50%, #0a0f1a 100%)' }}>

      <AnimatePresence>
        {!playerName && <LoginOverlay onLogin={handleLogin} loading={loginLoading} />}
      </AnimatePresence>

      {playerName && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full max-w-sm mx-auto px-4 py-8 flex flex-col gap-5">

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black tracking-widest" style={{ color: '#fbbf24' }}>LEGO RACING</h1>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>MATH GRID</p>
            </div>
            <button onClick={handleLogout}
              className="text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              Switch
            </button>
          </div>

          {/* Welcome banner */}
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.15),rgba(239,68,68,0.1))', border: '1.5px solid rgba(251,191,36,0.3)' }}>
            <p className="text-2xl font-black" style={{ color: '#fbbf24' }}>🏁 Welcome to the Grid,</p>
            <p className="text-3xl font-black mt-1" style={{ color: 'white' }}>Racer {firstName}!</p>
          </motion.div>

          {/* Last race result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl p-4 text-center"
                style={{ background: lastResult.position === 1 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${lastResult.position === 1 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                <p className="font-black text-base" style={{ color: lastResult.position === 1 ? '#fbbf24' : 'white' }}>
                  {lastResult.position === 1 ? '🥇 You won the race!' : lastResult.position === 2 ? '🥈 2nd place!' : lastResult.position === 3 ? '🥉 3rd place!' : '4th place — practice more!'}
                </p>
                {lastResult.coinsEarned > 0 && (
                  <p className="text-sm font-bold mt-1" style={{ color: '#fbbf24' }}>+{lastResult.coinsEarned} coins earned!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>COINS</p>
              <p className="text-3xl font-black" style={{ color: '#fbbf24' }}>{gameState.earned_coins ?? 0}</p>
            </div>
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>TRACKS</p>
              <p className="text-3xl font-black" style={{ color: '#34d399' }}>{(gameState.unlocked_tracks ?? [1]).length}</p>
            </div>
          </div>

          {/* START RACE — primary CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onPointerDown={() => setScreen('race')}
            className="py-5 rounded-2xl font-black text-lg tracking-wider relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', color: 'white', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 6px 24px rgba(239,68,68,0.45)' }}>
            {/* Animated shine */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: 'linear' }}
              style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', pointerEvents: 'none' }}
            />
            🏎️ START RACE
          </motion.button>

          {/* Sync status */}
          <AnimatePresence>
            {syncStatus && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center text-xs font-bold py-2 rounded-xl"
                style={{ background: syncStatus === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: syncStatus === 'error' ? '#fca5a5' : '#34d399' }}>
                {syncStatus === 'saving' ? '💾 Saving...' : syncStatus === 'saved' ? '✓ Progress saved' : '⚠ Save failed — progress is local'}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
