import { motion } from 'framer-motion'
import Robot from './Robot.jsx'
import { getAverageMastery, getGradeEquivalent, getUnlockedSkillCount, loadStreak } from '../engine/mastery.js'

export default function HomeScreen({ profile, currency, playerName, onStart, onMap, onBuildRoom, onDashboard }) {
  const streak = loadStreak()
  const gradeEq = getGradeEquivalent(profile)
  const unlockedCount = getUnlockedSkillCount(profile)

  const firstName = playerName ? playerName.trim().split(' ')[0] : 'Maker'
  const hour = new Date().getHours()
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const returning = profile.skills && Object.values(profile.skills).some(s => s.attempts > 0)
  const greeting = returning
    ? `Welcome back, ${firstName}! 🔥`
    : `${timeGreet}, ${firstName}! Ready to build?`

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white leading-none">MAKER LAB</h1>
          <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>MATH MISSION</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(251,191,36,0.15)' }}>
            <span>⚡</span>
            <span className="font-black text-yellow-300">{currency.bolts}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(251,113,133,0.15)' }}>
            <span>🧱</span>
            <span className="font-black text-pink-300">{currency.bricks}</span>
          </div>
          <button
            onClick={onDashboard}
            className="px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
          >
            📊
          </button>
        </div>
      </div>

      {/* Robot + greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <Robot mood="idle" message={greeting} size="lg" />
      </motion.div>

      {/* Stats row */}
      <div className="w-full grid grid-cols-3 gap-3">
        {[
          { label: 'STREAK', value: `${streak.count}🔥`, color: '#f97316' },
          { label: 'LEVEL', value: gradeEq.replace(' Grade', ''), color: '#6366f1' },
          { label: 'SKILLS', value: `${unlockedCount}`, color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <span className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</span>
            <span className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Daily Mission Card */}
      <motion.div
        className="w-full rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: '#818cf8', transform: 'translate(30%, -30%)' }} />
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: '#818cf8' }}>TODAY'S MISSION</p>
            <h2 className="text-xl font-black text-white">Daily Sprint</h2>
            <p className="text-sm mt-1" style={{ color: '#a5b4fc' }}>3 challenges · ~15 min</p>
          </div>
          <div className="text-4xl">🎯</div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {[
            { icon: '⚡', label: 'Warm-Up Speed Run', sub: '90-sec arithmetic sprint', color: '#fbbf24' },
            { icon: '🔍', label: 'The Quest', sub: '4 logic word problems', color: '#34d399' },
            { icon: '👾', label: 'Boss Challenge', sub: 'Mind-bender puzzle', color: '#f87171' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-black text-white">{item.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <motion.button
          onClick={onStart}
          whileTap={{ scale: 0.96 }}
          className="w-full py-4 rounded-2xl text-lg font-black text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.5)' }}
        >
          🚀 LAUNCH MISSION
        </motion.button>
      </motion.div>

      {/* Quick actions */}
      <div className="w-full grid grid-cols-2 gap-3">
        <motion.button
          onClick={onBuildRoom}
          whileTap={{ scale: 0.95 }}
          className="rounded-2xl p-4 flex flex-col items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #92400e40, #b45309)' }}
        >
          <span className="text-3xl">🏗️</span>
          <span className="text-sm font-black text-white">BUILD ROOM</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Spend your bolts</span>
        </motion.button>
        <motion.button
          onClick={onMap}
          whileTap={{ scale: 0.95 }}
          className="rounded-2xl p-4 flex flex-col items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #064e3b40, #065f46)' }}
        >
          <span className="text-3xl">🗺️</span>
          <span className="text-sm font-black text-white">SKILL MAP</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Track progress</span>
        </motion.button>
      </div>
    </div>
  )
}
