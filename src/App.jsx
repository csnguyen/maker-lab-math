import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HomeScreen from './components/HomeScreen.jsx'
import SessionScreen from './components/SessionScreen.jsx'
import BuildRoom from './components/BuildRoom.jsx'
import SkillMap from './components/SkillMap.jsx'
import ParentDashboard from './components/ParentDashboard.jsx'
import LoginOverlay from './components/LoginOverlay.jsx'
import {
  loadProfile, saveProfile,
  loadCurrency, saveCurrency,
  loadBlueprintState, saveBlueprintState,
  updateStreak,
} from './engine/mastery.js'
import {
  loadPlayerName, savePlayerName, clearPlayerName,
  fetchProgress, pushProgress,
  bundleLocalState, applyRemoteState,
} from './engine/sync.js'

export default function App() {
  const [playerName, setPlayerName] = useState(() => loadPlayerName())
  const [avatarIdx, setAvatarIdx] = useState(0)
  const [loginLoading, setLoginLoading] = useState(false)
  const [screen, setScreen] = useState('home')
  const [profile, setProfile] = useState(() => loadProfile())
  const [currency, setCurrency] = useState(() => loadCurrency())
  const [blueprintState, setBlueprintState] = useState(() => loadBlueprintState())

  // On mount: if player is already known, sync from cloud
  useEffect(() => {
    if (playerName) syncFromCloud(playerName)
  }, [])

  async function syncFromCloud(name) {
    try {
      const remote = await fetchProgress(name)
      if (remote?.data) {
        applyRemoteState(remote.data)
        setProfile(loadProfile())
        setCurrency(loadCurrency())
        setBlueprintState(loadBlueprintState())
      }
    } catch {}
  }

  async function handleLogin(name, avatar) {
    setLoginLoading(true)
    setAvatarIdx(avatar)
    try {
      const remote = await fetchProgress(name)
      if (remote?.data) {
        // Returning player — apply their cloud state
        applyRemoteState(remote.data)
      } else {
        // New player — push local defaults up to cloud
        await pushProgress(name, bundleLocalState())
      }
    } catch {}
    savePlayerName(name)
    setPlayerName(name)
    setProfile(loadProfile())
    setCurrency(loadCurrency())
    setBlueprintState(loadBlueprintState())
    setLoginLoading(false)
  }

  async function handleSessionComplete({ boltsEarned, bricksEarned }) {
    const newCurrency = {
      bolts: currency.bolts + boltsEarned,
      bricks: currency.bricks + bricksEarned,
    }
    setCurrency(newCurrency)
    saveCurrency(newCurrency)
    updateStreak()
    // Push updated state to cloud
    if (playerName) {
      await pushProgress(playerName, bundleLocalState())
    }
    setScreen('build')
  }

  function handleUpdateProfile(newProfile) {
    setProfile(newProfile)
    // Cloud push happens per-answer in SessionScreen; no extra push needed here
  }

  async function handleCurrencyAndBlueprintUpdate(newCurrency, newBlueprintState) {
    setCurrency(newCurrency)
    setBlueprintState(newBlueprintState)
    if (playerName) {
      await pushProgress(playerName, bundleLocalState())
    }
  }

  const screenProps = {
    home: {
      component: HomeScreen,
      props: {
        profile,
        currency,
        playerName,
        onStart: () => setScreen('session'),
        onMap: () => setScreen('map'),
        onBuildRoom: () => setScreen('build'),
        onDashboard: () => setScreen('dashboard'),
      },
    },
    session: {
      component: SessionScreen,
      props: {
        profile,
        playerName,
        onComplete: handleSessionComplete,
        onUpdateProfile: handleUpdateProfile,
      },
    },
    build: {
      component: BuildRoom,
      props: {
        currency,
        blueprintState,
        onClose: () => setScreen('home'),
        onUpdate: handleCurrencyAndBlueprintUpdate,
      },
    },
    map: {
      component: SkillMap,
      props: { profile, onClose: () => setScreen('home') },
    },
    dashboard: {
      component: ParentDashboard,
      props: {
        profile,
        playerName,
        onClose: () => setScreen('home'),
        onLogout: () => { clearPlayerName(); setPlayerName(null) },
      },
    },
  }

  const { component: Screen, props } = screenProps[screen]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1a0a2e 50%, #0a1628 100%)' }}>
      {/* Star field */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, background: 'white',
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.1,
              animation: `pulse-glow ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }} />
        ))}
      </div>

      {/* Login gate */}
      <AnimatePresence>
        {!playerName && (
          <LoginOverlay onLogin={handleLogin} loading={loginLoading} />
        )}
      </AnimatePresence>

      {/* App screens */}
      <AnimatePresence mode="wait">
        <motion.div key={screen}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }} className="relative z-10">
          <Screen {...props} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
