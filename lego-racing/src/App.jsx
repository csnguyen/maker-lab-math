import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoginOverlay from './components/LoginOverlay.jsx'
import RaceScreen  from './components/RaceScreen.jsx'
import Garage      from './components/Garage.jsx'
import {
  loadPlayerName, savePlayerName, clearPlayerName,
  fetchProgress, pushProgress, applyRemoteProfile,
  loadLocalGameState, saveLocalGameState, defaultGameState,
  loadLocalMastery, saveLocalMastery, mergeMastery,
  seedAdvancedProfile,
} from './engine/sync.js'
import { selectSkill } from './engine/mastery.js'
import { initMastery } from './engine/curriculum.js'
import { SKILLS } from './engine/curriculum.js'

export default function App() {
  const [playerName,    setPlayerName]    = useState(() => loadPlayerName())
  const [gameState,     setGameState]     = useState(() => loadLocalGameState())
  const [globalMastery, setGlobalMastery] = useState(() => loadLocalMastery())
  const [loginLoading,  setLoginLoading]  = useState(false)
  const [screen,        setScreen]        = useState('dashboard') // 'dashboard' | 'race' | 'garage'
  const [syncStatus,    setSyncStatus]    = useState(null)
  const [lastResult,    setLastResult]    = useState(null)
  const [syncTestResult, setSyncTestResult] = useState(null)

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLogin(name) {
    setLoginLoading(true)
    try {
      const { exists, data, offline } = await fetchProgress(name)
      if (exists && data) {
        applyRemoteProfile(data)
        const gs = data.game_states?.lego_racing ?? defaultGameState()
        const merged = { ...defaultGameState(), ...gs }
        setGameState(merged); saveLocalGameState(merged)
        // Merge remote + local mastery (take max per key — offline resilience)
        const localM  = loadLocalMastery()
        const remoteM = data.global_math_mastery ?? {}
        const finalM  = mergeMastery(remoteM, localM)
        setGlobalMastery(finalM); saveLocalMastery(finalM)
        if (offline) setSyncStatus('offline')
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
  async function saveProgress(newState, masteryDeltaObj = {}) {
    setSyncStatus('saving')
    setGameState(newState); saveLocalGameState(newState)
    const result = await pushProgress(playerName, newState, masteryDeltaObj)
    if (result?.ok === false && result?.source === 'offline') {
      setSyncStatus('offline')
    } else {
      setSyncStatus('saved')
      setTimeout(() => setSyncStatus(null), 2000)
    }
  }

  // ── Race complete ─────────────────────────────────────────────────────────
  function handleRaceComplete({ position, coinsEarned = 0, updatedMastery = {}, replay = false }) {
    setScreen('dashboard')
    if (!replay) {
      setLastResult({ position, coinsEarned })
      if (Object.keys(updatedMastery).length > 0) {
        const merged = mergeMastery(globalMastery, updatedMastery)
        setGlobalMastery(merged); saveLocalMastery(merged)
      }
      const updated = { ...gameState, earned_coins: (gameState.earned_coins ?? 0) + coinsEarned }
      saveProgress(updated, updatedMastery)
    }
  }

  // ── Garage: buy a part ────────────────────────────────────────────────────
  function handleBuyPart(partId, price) {
    if ((gameState.earned_coins ?? 0) < price) return
    const updated = {
      ...gameState,
      earned_coins: (gameState.earned_coins ?? 0) - price,
      owned_parts: [...(gameState.owned_parts ?? []), partId],
    }
    saveProgress(updated)
  }

  // ── Garage: equip / unequip a part ────────────────────────────────────────
  function handleEquipPart(slot, partId) {
    const updated = {
      ...gameState,
      equipped_car: { ...(gameState.equipped_car ?? {}), [slot]: partId },
    }
    saveProgress(updated)
  }

  // ── Cross-game sync test ──────────────────────────────────────────────────
  function runSyncTest() {
    const { advancedMastery } = seedAdvancedProfile('TESTPRO')
    const mastery   = initMastery(advancedMastery)
    const startSkill = selectSkill(mastery)
    const skill = SKILLS[startSkill]
    setSyncTestResult({
      playerSeeded: 'TESTPRO',
      masterySnapshot: {
        add_within_10:  Math.round(advancedMastery.add_within_10  * 100) + '%',
        sub_within_20:  Math.round(advancedMastery.sub_within_20  * 100) + '%',
        add_2digit:     Math.round(advancedMastery.add_2digit      * 100) + '%',
        mult_2s_5s:     Math.round(advancedMastery.mult_2s_5s     * 100) + '%',
      },
      zdpSkill: `${skill?.label} (${startSkill})`,
      verdict: startSkill.includes('mult') || startSkill.includes('add_2digit') || startSkill.includes('sub_2digit')
        ? '✅ PASS — advanced skill selected, basic drills skipped'
        : '⚠ Unexpected — check prereq thresholds',
    })
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function handleLogout() {
    if (!window.confirm('Switch racer?')) return
    clearPlayerName(); setPlayerName(null)
    setGameState(defaultGameState()); setGlobalMastery({}); setScreen('dashboard')
  }

  // ── Full-screen sub-pages ─────────────────────────────────────────────────
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

  if (playerName && screen === 'garage') {
    return (
      <Garage
        playerName={playerName.split(' ')[0]}
        coins={gameState.earned_coins ?? 0}
        equippedCar={gameState.equipped_car ?? {}}
        ownedParts={gameState.owned_parts ?? []}
        globalMastery={globalMastery}
        onBuy={handleBuyPart}
        onEquip={handleEquipPart}
        onBack={() => setScreen('dashboard')}
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
          className="w-full max-w-sm mx-auto px-4 py-6 flex flex-col gap-4">

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

          {/* Welcome */}
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl p-4 text-center"
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
                  {lastResult.position === 1 ? '🥇 You won the race!' : lastResult.position === 2 ? '🥈 2nd place!' : lastResult.position === 3 ? '🥉 3rd place!' : '4th — keep practicing!'}
                </p>
                {lastResult.coinsEarned > 0 && (
                  <p className="text-sm font-bold mt-1" style={{ color: '#fbbf24' }}>+{lastResult.coinsEarned} 🪙 coins earned!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>COINS</p>
              <p className="text-3xl font-black" style={{ color: '#fbbf24' }}>{gameState.earned_coins ?? 0}</p>
            </div>
            <div className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>PARTS</p>
              <p className="text-3xl font-black" style={{ color: '#34d399' }}>
                {(gameState.owned_parts ?? []).length}
              </p>
            </div>
          </div>

          {/* Primary CTAs */}
          <motion.button whileTap={{ scale: 0.97 }} onPointerDown={() => setScreen('race')}
            className="py-5 rounded-2xl font-black text-lg tracking-wider relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', color:'white', border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 6px 24px rgba(239,68,68,0.45)' }}>
            <motion.div animate={{ x:['-100%','200%'] }} transition={{ duration:2.4, repeat:Infinity, repeatDelay:1.2, ease:'linear' }}
              style={{ position:'absolute', top:0, left:0, width:'40%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', pointerEvents:'none' }} />
            🏎️ START RACE
          </motion.button>

          <motion.button whileTap={{ scale: 0.97 }} onPointerDown={() => setScreen('garage')}
            className="py-4 rounded-2xl font-black text-base"
            style={{ background:'rgba(251,191,36,0.12)', color:'#fbbf24', border:'1.5px solid rgba(251,191,36,0.35)', boxShadow:'0 3px 12px rgba(251,191,36,0.15)' }}>
            🔧 LEGO GARAGE  {(gameState.owned_parts ?? []).length > 0 && `· ${(gameState.owned_parts).length} part${(gameState.owned_parts).length > 1 ? 's' : ''} owned`}
          </motion.button>

          {/* Cross-game sync test */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onPointerDown={runSyncTest}
              className="w-full py-3 text-xs font-bold text-left px-4"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
              🧪 Test Cross-Game Sync (seeds TESTPRO with Maker Lab scores)
            </button>
            <AnimatePresence>
              {syncTestResult && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <div className="px-4 pb-4 pt-2 text-xs space-y-1"
                    style={{ background: 'rgba(34,197,94,0.06)' }}>
                    <p className="font-bold" style={{ color: '#4ade80' }}>{syncTestResult.verdict}</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Player: <b>{syncTestResult.playerSeeded}</b> | ZPD skill: <b>{syncTestResult.zdpSkill}</b>
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {Object.entries(syncTestResult.masterySnapshot).map(([k, v]) => (
                        <span key={k} style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                          {k.replace(/_/g, '_')}: {v}
                        </span>
                      ))}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      ↑ Login as <b>TESTPRO</b> to race with these scores loaded
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sync status */}
          <AnimatePresence>
            {syncStatus && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="text-center text-xs font-bold py-2 rounded-xl"
                style={{ background: syncStatus === 'error' ? 'rgba(239,68,68,0.15)' : syncStatus === 'offline' ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.15)', color: syncStatus === 'error' ? '#fca5a5' : syncStatus === 'offline' ? '#fbbf24' : '#34d399' }}>
                {syncStatus === 'saving' ? '💾 Saving...' : syncStatus === 'saved' ? '✓ Progress saved to cloud' : syncStatus === 'offline' ? '📱 Offline — saved locally, will sync when connected' : '⚠ Save failed'}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
