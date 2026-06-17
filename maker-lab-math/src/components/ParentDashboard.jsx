import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import MasteryBar from './MasteryBar.jsx'
import { SKILLS, DOMAINS } from '../data/curriculum.js'
import { getAverageMastery, getGradeEquivalent, getUnlockedSkillCount, loadStreak, exportAllData, importAllData } from '../engine/mastery.js'

const PARENT_PASSWORD = 'maker2024'

export default function ParentDashboard({ profile, playerName, onClose, onLogout }) {
  const [unlocked, setUnlocked] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const [showBackup, setShowBackup] = useState(false)
  const importRef = useRef(null)

  function tryUnlock() {
    if (pw === PARENT_PASSWORD) { setUnlocked(true); setError(false) }
    else { setError(true); setPw('') }
  }

  function handleExport() {
    const data = exportAllData()
    setExportText(data)
    if (navigator.clipboard) navigator.clipboard.writeText(data).catch(() => {})
  }

  function handleImport() {
    try {
      importAllData(importText.trim())
      setImportMsg('✅ Import successful! Reload the page to see changes.')
      setImportText('')
    } catch (e) {
      setImportMsg('❌ Invalid backup data. Please check and try again.')
    }
  }

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6 max-w-sm mx-auto text-center">
        <div className="text-5xl">🔐</div>
        <h1 className="text-2xl font-black text-white">Parent Dashboard</h1>
        <p style={{ color: '#94a3b8' }}>Enter your parent PIN to view learning data</p>
        <div className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            placeholder="Enter PIN"
            className="w-full px-4 py-4 rounded-2xl text-white text-center text-xl font-black"
            style={{ background: 'rgba(255,255,255,0.1)', border: error ? '2px solid #f87171' : '2px solid rgba(255,255,255,0.1)', outline: 'none' }}
          />
          {error && <p className="text-red-400 text-sm font-bold">Incorrect PIN. Try: maker2024</p>}
          <motion.button
            onClick={tryUnlock}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 rounded-2xl text-lg font-black text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            UNLOCK
          </motion.button>
        </div>
        <button onClick={onClose} className="text-sm font-bold" style={{ color: '#94a3b8' }}>← Back to Lab</button>
      </div>
    )
  }

  const streak = loadStreak()
  const avgMastery = getAverageMastery(profile)
  const gradeEq = getGradeEquivalent(profile)
  const unlockedCount = getUnlockedSkillCount(profile)

  const domainSummary = Object.entries(DOMAINS).map(([key, d]) => {
    const domainSkills = SKILLS.filter(s => s.domain === key)
    const unlockedDomain = domainSkills.filter(s => profile.skills[s.id]?.unlocked)
    const avgDomainMastery = unlockedDomain.length
      ? unlockedDomain.reduce((sum, s) => sum + (profile.skills[s.id]?.mastery_score || 0), 0) / unlockedDomain.length
      : 0
    return { key, ...d, avg: avgDomainMastery, total: domainSkills.length, unlocked: unlockedDomain.length }
  })

  const masteredSkills = SKILLS.filter(s => (profile.skills[s.id]?.mastery_score || 0) >= 0.9 && profile.skills[s.id]?.unlocked)

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-sm mx-auto gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">📊 Parent Dashboard</h1>
          {playerName && (
            <p className="text-xs font-bold" style={{ color: '#a5b4fc' }}>
              Player: <span className="text-white">{playerName}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {onLogout && (
            <button
              onClick={() => { if (window.confirm('Switch player? This will log out.')) onLogout() }}
              className="px-3 py-1.5 rounded-xl font-bold text-xs"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
            >
              Switch Player
            </button>
          )}
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>← Back</button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Grade Equivalent', value: gradeEq, color: '#6366f1', icon: '🎓' },
          { label: 'Day Streak', value: `${streak.count} days 🔥`, color: '#f97316', icon: '📅' },
          { label: 'Skills Unlocked', value: `${unlockedCount} / ${SKILLS.length}`, color: '#10b981', icon: '🔓' },
          { label: 'Avg Mastery', value: `${Math.round(avgMastery * 100)}%`, color: '#a78bfa', icon: '⭐' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Domain breakdown */}
      <div>
        <h2 className="text-base font-black text-white mb-3">Domain Mastery</h2>
        <div className="flex flex-col gap-3">
          {domainSummary.map(d => (
            <div key={d.key} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span>{d.icon}</span>
                  <span className="text-sm font-black text-white">{d.label}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {d.unlocked}/{d.total} unlocked
                </span>
              </div>
              <MasteryBar score={d.avg} color={d.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Mastered skills */}
      {masteredSkills.length > 0 && (
        <div>
          <h2 className="text-base font-black text-white mb-3">⭐ Mastered Skills ({masteredSkills.length})</h2>
          <div className="flex flex-wrap gap-2">
            {masteredSkills.map(skill => {
              const domain = DOMAINS[skill.domain]
              return (
                <div key={skill.id} className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: `${domain.color}20`, color: domain.color, border: `1px solid ${domain.color}40` }}>
                  {domain.icon} {skill.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Trajectory note */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <h3 className="text-sm font-black text-white mb-1">📈 Trajectory</h3>
        <p className="text-xs" style={{ color: '#a5b4fc' }}>
          Currently performing at <strong style={{ color: '#818cf8' }}>{gradeEq}</strong> level.
          {unlockedCount > 10
            ? ' Unlock rate is excellent — skills are progressing ahead of grade level.'
            : ' Building a strong foundation. Keep up the daily missions!'}
        </p>
      </div>

      {/* Backup section — tap "Data Backup" label 1x to reveal */}
      <div>
        <button
          onClick={() => setShowBackup(v => !v)}
          className="w-full text-xs font-bold text-center py-1"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          {showBackup ? '▲ Hide Backup' : '▼ Data Backup · PIN: maker2024'}
        </button>

        {showBackup && (
          <div className="mt-3 flex flex-col gap-3">
            {/* Export */}
            <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-sm font-black text-white">📤 Export Progress</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Copies all progress to clipboard as a backup string.</p>
              <motion.button
                onClick={handleExport}
                whileTap={{ scale: 0.95 }}
                className="py-2 px-4 rounded-xl text-sm font-black text-white"
                style={{ background: 'rgba(99,102,241,0.4)' }}
              >
                Copy Backup to Clipboard
              </motion.button>
              {exportText && (
                <textarea
                  readOnly
                  value={exportText}
                  rows={4}
                  className="w-full text-xs rounded-xl p-2 font-mono resize-none"
                  style={{ background: 'rgba(0,0,0,0.4)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                  onClick={e => e.target.select()}
                />
              )}
            </div>

            {/* Import */}
            <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-sm font-black text-white">📥 Import Progress</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Paste a backup string to restore progress. This overwrites current data.</p>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='Paste backup JSON here…'
                rows={3}
                className="w-full text-xs rounded-xl p-2 font-mono resize-none"
                style={{ background: 'rgba(0,0,0,0.4)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <motion.button
                onClick={handleImport}
                whileTap={{ scale: 0.95 }}
                disabled={!importText.trim()}
                className="py-2 px-4 rounded-xl text-sm font-black text-white"
                style={{ background: importText.trim() ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)', opacity: importText.trim() ? 1 : 0.5 }}
              >
                Restore from Backup
              </motion.button>
              {importMsg && (
                <p className="text-xs font-bold" style={{ color: importMsg.startsWith('✅') ? '#34d399' : '#f87171' }}>
                  {importMsg}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
