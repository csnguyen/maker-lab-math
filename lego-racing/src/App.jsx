import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoginOverlay from './components/LoginOverlay.jsx'
import {
  loadPlayerName, savePlayerName, clearPlayerName,
  fetchProgress, pushProgress, applyRemoteProfile,
  loadLocalGameState, saveLocalGameState, defaultGameState,
} from './engine/sync.js'

export default function App() {
  const [playerName, setPlayerName] = useState(() => loadPlayerName())
  const [gameState, setGameState] = useState(() => loadLocalGameState())
  const [loginLoading, setLoginLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null) // 'saving' | 'saved' | 'error'

  // ── Login ─────────────────────────────────────────────────────────────────

  async function handleLogin(name) {
    setLoginLoading(true)
    try {
      const { exists, data } = await fetchProgress(name)
      if (exists && data) {
        applyRemoteProfile(data)
        const gs = data.game_states?.lego_racing ?? defaultGameState()
        setGameState(gs)
        saveLocalGameState(gs)
      } else {
        // New student — provision defaults and write to store immediately
        const fresh = defaultGameState()
        await pushProgress(name, fresh)
        setGameState(fresh)
        saveLocalGameState(fresh)
      }
      savePlayerName(name)
      setPlayerName(name)
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Save progress ─────────────────────────────────────────────────────────

  async function saveProgress(newState) {
    setSyncStatus('saving')
    setGameState(newState)
    saveLocalGameState(newState)
    try {
      await pushProgress(playerName, newState)
      setSyncStatus('saved')
      setTimeout(() => setSyncStatus(null), 2000)
    } catch {
      setSyncStatus('error')
    }
  }

  // ── Demo action: earn a coin ──────────────────────────────────────────────

  function earnCoin() {
    const updated = { ...gameState, earned_coins: (gameState.earned_coins ?? 0) + 1 }
    saveProgress(updated)
  }

  function unlockTrack(n) {
    const tracks = gameState.unlocked_tracks ?? [1]
    if (!tracks.includes(n)) {
      const updated = { ...gameState, unlocked_tracks: [...tracks, n] }
      saveProgress(updated)
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  function handleLogout() {
    if (!window.confirm('Switch racer?')) return
    clearPlayerName()
    setPlayerName(null)
    setGameState(defaultGameState())
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const firstName = playerName ? playerName.trim().split(' ')[0] : 'Racer'

  return (
    <div className="min-h-screen flex flex-col items-center"
      style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #1a0a00 50%, #0a0f1a 100%)' }}>

      <AnimatePresence>
        {!playerName && (
          <LoginOverlay onLogin={handleLogin} loading={loginLoading} />
        )}
      </AnimatePresence>

      {playerName && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black tracking-widest" style={{ color: '#fbbf24' }}>
                LEGO RACING
              </h1>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                MATH GRID
              </p>
            </div>
            <button onClick={handleLogout}
              className="text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              Switch
            </button>
          </div>

          {/* Welcome banner */}
          <motion.div
            initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(239,68,68,0.1))', border: '1.5px solid rgba(251,191,36,0.3)' }}>
            <p className="text-2xl font-black" style={{ color: '#fbbf24' }}>
              🏁 Welcome to the Grid,
            </p>
            <p className="text-3xl font-black mt-1" style={{ color: 'white' }}>
              Racer {firstName}!
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>COINS</p>
              <p className="text-3xl font-black" style={{ color: '#fbbf24' }}>
                {gameState.earned_coins ?? 0}
              </p>
            </div>
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>TRACKS</p>
              <p className="text-3xl font-black" style={{ color: '#34d399' }}>
                {(gameState.unlocked_tracks ?? [1]).length}
              </p>
            </div>
          </div>

          {/* Demo actions */}
          <div className="flex flex-col gap-3">
            <button onClick={earnCoin}
              className="py-4 rounded-2xl font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f0f1a' }}>
              🪙 EARN A COIN (demo)
            </button>
            <button onClick={() => unlockTrack((gameState.unlocked_tracks?.length ?? 1) + 1)}
              className="py-4 rounded-2xl font-black text-sm"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1.5px solid rgba(52,211,153,0.4)' }}>
              🔓 UNLOCK NEXT TRACK (demo)
            </button>
          </div>

          {/* Sync status */}
          <AnimatePresence>
            {syncStatus && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center text-xs font-bold py-2 rounded-xl"
                style={{
                  background: syncStatus === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                  color: syncStatus === 'error' ? '#fca5a5' : '#34d399',
                }}>
                {syncStatus === 'saving' ? '💾 Saving...' : syncStatus === 'saved' ? '✓ Progress saved' : '⚠ Save failed — progress is local'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Debug: show raw state */}
          <details className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <summary className="cursor-pointer font-bold">Debug: game_state</summary>
            <pre className="mt-2 p-3 rounded-xl text-left overflow-auto"
              style={{ background: 'rgba(255,255,255,0.04)', fontSize: 10 }}>
              {JSON.stringify(gameState, null, 2)}
            </pre>
          </details>
        </motion.div>
      )}
    </div>
  )
}
