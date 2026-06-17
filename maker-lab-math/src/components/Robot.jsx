import { motion, AnimatePresence } from 'framer-motion'

const MOODS = {
  idle: { eyes: '⊙', mouth: '⌣', color: '#60a5fa', sparkle: false },
  happy: { eyes: '◕', mouth: '◡', color: '#34d399', sparkle: true },
  excited: { eyes: '★', mouth: '◡', color: '#fbbf24', sparkle: true },
  thinking: { eyes: '⊙', mouth: '⊙', color: '#a78bfa', sparkle: false },
  sad: { eyes: '×', mouth: '⌢', color: '#f87171', sparkle: false },
  celebrate: { eyes: '★', mouth: '◡', color: '#f59e0b', sparkle: true },
}

export default function Robot({ mood = 'idle', message = '', size = 'md' }) {
  const m = MOODS[mood] || MOODS.idle
  const sizes = {
    sm: { robot: 64, face: 28, font: 14 },
    md: { robot: 96, face: 40, font: 20 },
    lg: { robot: 128, face: 56, font: 28 },
  }
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="relative flex items-center justify-center rounded-2xl"
        style={{ width: s.robot, height: s.robot, background: m.color, boxShadow: `0 0 20px ${m.color}60` }}
        animate={mood === 'celebrate' ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } :
                 mood === 'excited' ? { y: [0, -6, 0, -4, 0] } :
                 mood === 'thinking' ? { rotate: [-3, 3, -3] } :
                 { y: [0, -3, 0] }}
        transition={{ duration: mood === 'celebrate' ? 0.6 : 2, repeat: mood === 'idle' || mood === 'thinking' ? Infinity : 0, ease: 'easeInOut' }}
      >
        {/* Antenna */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ background: m.sparkle ? '#fbbf24' : '#94a3b8' }}
            animate={m.sparkle ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <div className="w-1 h-3" style={{ background: '#94a3b8' }} />
        </div>

        {/* Face */}
        <div className="flex flex-col items-center" style={{ fontSize: s.font, lineHeight: 1.2 }}>
          <span style={{ letterSpacing: 6 }}>{m.eyes} {m.eyes}</span>
          <span style={{ fontSize: s.font * 0.7 }}>{m.mouth}</span>
        </div>

        {/* Sparkles */}
        <AnimatePresence>
          {m.sparkle && [0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute text-yellow-300"
              style={{ fontSize: 10, top: Math.random() * 80 + '%', left: Math.random() * 80 + '%' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], y: -20 }}
              transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity, repeatDelay: 1 }}
            >
              ✦
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative px-3 py-1.5 rounded-xl text-white text-center max-w-48"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', fontSize: 13, fontWeight: 700 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
