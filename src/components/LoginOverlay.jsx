import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ROBOT_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fb923c', '#a78bfa']
const ROBOT_EMOJIS = ['🤖', '👾', '🦾', '🚀', '⚡']

export default function LoginOverlay({ onLogin, loading }) {
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [shaking, setShaking] = useState(false)

  function handleSubmit() {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }
    onLogin(trimmed, selectedAvatar)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}>

      {/* Floating stars */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full bg-white"
          style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.3 }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }} />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <div className="text-center">
          <motion.div className="text-6xl mb-2"
            animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
            🏗️
          </motion.div>
          <h1 className="text-3xl font-black text-white">MAKER LAB</h1>
          <p className="text-sm font-bold mt-1" style={{ color: '#a5b4fc' }}>MATH MISSION</p>
        </div>

        {/* Avatar picker */}
        <div>
          <p className="text-center text-xs font-bold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>PICK YOUR ROBOT</p>
          <div className="flex gap-3 justify-center">
            {ROBOT_COLORS.map((color, i) => (
              <motion.button key={i} onPointerDown={() => setSelectedAvatar(i)}
                whileTap={{ scale: 0.85 }}
                className="rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  width: 56, height: 56,
                  background: selectedAvatar === i ? color : 'rgba(255,255,255,0.08)',
                  border: selectedAvatar === i ? `3px solid ${color}` : '3px solid transparent',
                  boxShadow: selectedAvatar === i ? `0 0 20px ${color}80` : 'none',
                  transition: 'all 0.2s',
                }}>
                {ROBOT_EMOJIS[i]}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="w-full flex flex-col gap-3">
          <p className="text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>WHAT'S YOUR NAME?</p>
          <motion.div animate={shaking ? { x: [-8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.4 }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your name…"
              autoFocus
              maxLength={20}
              className="w-full px-5 py-4 rounded-2xl text-white text-xl font-black text-center"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: `2px solid ${ROBOT_COLORS[selectedAvatar]}60`,
                outline: 'none',
                letterSpacing: 2,
                fontSize: 22,
              }}
            />
          </motion.div>
          {shaking && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm font-bold text-red-400">
              Need at least 2 letters!
            </motion.p>
          )}
        </div>

        {/* Enter button */}
        <motion.button
          onPointerDown={handleSubmit}
          whileTap={{ scale: 0.94 }}
          disabled={loading}
          className="w-full py-5 rounded-2xl text-xl font-black text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${ROBOT_COLORS[selectedAvatar]}, ${ROBOT_COLORS[(selectedAvatar + 1) % ROBOT_COLORS.length]})`,
            boxShadow: `0 8px 30px ${ROBOT_COLORS[selectedAvatar]}60`,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Loading your lab…
              </motion.span>
            ) : (
              <motion.span key="enter" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {name.trim() ? `Enter the Lab, ${name.trim().split(' ')[0]}! 🚀` : 'Enter the Lab! 🚀'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Your progress saves automatically
        </p>
      </motion.div>
    </div>
  )
}
