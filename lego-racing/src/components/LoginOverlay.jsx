import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CARS = [
  { color: '#ef4444', emoji: '🏎️' },
  { color: '#3b82f6', emoji: '🚗' },
  { color: '#22c55e', emoji: '🚙' },
  { color: '#f59e0b', emoji: '🚕' },
  { color: '#a855f7', emoji: '🏁' },
]

export default function LoginOverlay({ onLogin, loading = false }) {
  const [name, setName] = useState('')
  const [carIdx, setCarIdx] = useState(0)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const inputRef = useRef(null)

  const trimmed = name.trim()
  const firstName = trimmed.split(' ')[0]

  function handleSubmit() {
    if (trimmed.length < 2) {
      setError('Need at least 2 characters!')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }
    setError('')
    onLogin(trimmed, carIdx)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #1a0a00 50%, #0a0f1a 100%)' }}
    >
      {/* Animated track lines */}
      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          className="absolute"
          style={{
            top: `${10 + i * 12}%`,
            left: '-10%',
            width: '120%',
            height: 2,
            background: `rgba(255,255,255,${0.03 + (i % 2) * 0.02})`,
          }}
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Floating speed particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: CARS[i % CARS.length].color,
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 80 + 10}%`,
            opacity: 0.6,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
        className="relative z-10 flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm mx-4"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1.5px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <motion.div
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl"
        >
          🏁
        </motion.div>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-widest" style={{ color: '#fbbf24' }}>
            LEGO RACING
          </h1>
          <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            MATH GRID — CHOOSE YOUR RACER
          </p>
        </div>

        {/* Car selector */}
        <div className="flex gap-3">
          {CARS.map((car, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onPointerDown={() => setCarIdx(i)}
              className="text-2xl w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
              style={{
                background: i === carIdx ? `${car.color}33` : 'rgba(255,255,255,0.06)',
                border: `2.5px solid ${i === carIdx ? car.color : 'rgba(255,255,255,0.12)'}`,
                boxShadow: i === carIdx ? `0 0 16px ${car.color}66` : 'none',
              }}
            >
              {car.emoji}
            </motion.button>
          ))}
        </div>

        {/* Name input */}
        <motion.div
          className="w-full"
          animate={shaking ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.35 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter your name, Racer..."
            maxLength={24}
            className="w-full px-4 py-3.5 rounded-2xl text-center text-base font-bold outline-none"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `2px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
              color: 'white',
            }}
          />
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs font-bold text-center mt-2" style={{ color: '#fca5a5' }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Launch button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onPointerDown={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-sm tracking-widest relative overflow-hidden"
          style={{
            background: trimmed.length >= 2
              ? `linear-gradient(135deg, ${CARS[carIdx].color}, ${CARS[carIdx].color}bb)`
              : 'rgba(255,255,255,0.08)',
            color: trimmed.length >= 2 ? 'white' : 'rgba(255,255,255,0.3)',
            border: `2px solid ${trimmed.length >= 2 ? CARS[carIdx].color : 'rgba(255,255,255,0.1)'}`,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              LOADING GRID...
            </motion.span>
          ) : trimmed.length >= 2 ? (
            `START RACING, ${firstName.toUpperCase()}! 🏎️`
          ) : (
            'ENTER YOUR NAME TO RACE'
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
