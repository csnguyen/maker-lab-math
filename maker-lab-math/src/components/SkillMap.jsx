import { useState } from 'react'
import { motion } from 'framer-motion'
import MasteryBar from './MasteryBar.jsx'
import { SKILLS, DOMAINS } from '../data/curriculum.js'

export default function SkillMap({ profile, onClose }) {
  const [selectedDomain, setSelectedDomain] = useState(null)

  const domains = Object.entries(DOMAINS)
  const filteredSkills = SKILLS.filter(s => !selectedDomain || s.domain === selectedDomain)

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-sm mx-auto gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">🗺️ SKILL MAP</h1>
          <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>Your learning journey</p>
        </div>
        <button onClick={onClose} className="px-3 py-1.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          ← Back
        </button>
      </div>

      {/* Domain filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDomain(null)}
          className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black"
          style={{
            background: !selectedDomain ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)',
            color: '#fff',
            border: !selectedDomain ? '1px solid #6366f1' : '1px solid transparent',
          }}
        >
          All
        </button>
        {domains.map(([key, d]) => (
          <button
            key={key}
            onClick={() => setSelectedDomain(key === selectedDomain ? null : key)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1"
            style={{
              background: selectedDomain === key ? `${d.color}33` : 'rgba(255,255,255,0.07)',
              color: selectedDomain === key ? d.color : '#94a3b8',
              border: selectedDomain === key ? `1px solid ${d.color}` : '1px solid transparent',
            }}
          >
            <span>{d.icon}</span> {d.label}
          </button>
        ))}
      </div>

      {/* Skill list */}
      <div className="flex flex-col gap-2">
        {filteredSkills.map((skill, i) => {
          const entry = profile.skills[skill.id]
          const domain = DOMAINS[skill.domain]
          const mastery = entry?.mastery_score ?? 0
          const unlocked = entry?.unlocked ?? false

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-2xl"
              style={{
                background: unlocked ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                border: mastery >= 0.9 ? `1px solid ${domain.color}60` : '1px solid transparent',
                opacity: unlocked ? 1 : 0.5,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{domain.icon}</span>
                  <span className="text-sm font-black text-white">{skill.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                    G{skill.grade}
                  </span>
                  {!unlocked && <span className="text-base">🔒</span>}
                  {mastery >= 0.95 && <span className="text-base">⭐</span>}
                </div>
              </div>
              {unlocked && (
                <MasteryBar
                  score={mastery}
                  color={domain.color}
                />
              )}
              {unlocked && (
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {entry?.attempts ?? 0} attempts
                  </span>
                  {mastery >= 0.95 && (
                    <span className="text-xs font-bold" style={{ color: domain.color }}>MASTERED ✓</span>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
