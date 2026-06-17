import { motion } from 'framer-motion'

export default function MasteryBar({ score, label, color = '#6366f1' }) {
  const pct = Math.round(score * 100)
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <span>{label}</span>
          <span style={{ color }}>{pct}%</span>
        </div>
      )}
      <div className="w-full rounded-full h-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-3 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
