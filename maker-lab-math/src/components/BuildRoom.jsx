import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BLUEPRINTS, saveBlueprintState, saveCurrency } from '../engine/mastery.js'

// ── SVG Blueprint illustrations ──────────────────────────────────────────────
// Each blueprint has `parts` array matching the BLUEPRINTS parts list.
// Parts are SVG <g> elements rendered when that part index is built.

function RocketSVG({ builtParts }) {
  return (
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Launch Pad — part 3 */}
      <AnimatePresence>
        {builtParts.includes(3) && (
          <motion.g key="pad" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
            <rect x="40" y="190" width="120" height="14" rx="4" fill="#64748b" />
            <rect x="60" y="178" width="80" height="14" rx="3" fill="#94a3b8" />
            <rect x="88" y="166" width="24" height="14" rx="2" fill="#cbd5e1" />
            {/* Flame holes */}
            <ellipse cx="78" cy="204" rx="8" ry="4" fill="#374151" />
            <ellipse cx="122" cy="204" rx="8" ry="4" fill="#374151" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Booster — part 2 */}
      <AnimatePresence>
        {builtParts.includes(2) && (
          <motion.g key="booster" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
            {/* Left booster */}
            <rect x="65" y="120" width="22" height="52" rx="6" fill="#7c3aed" />
            <ellipse cx="76" cy="120" rx="11" ry="6" fill="#8b5cf6" />
            <ellipse cx="76" cy="172" rx="8" ry="4" fill="#4c1d95" />
            {/* Right booster */}
            <rect x="113" y="120" width="22" height="52" rx="6" fill="#7c3aed" />
            <ellipse cx="124" cy="120" rx="11" ry="6" fill="#8b5cf6" />
            <ellipse cx="124" cy="172" rx="8" ry="4" fill="#4c1d95" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Fuel Tank — part 1 */}
      <AnimatePresence>
        {builtParts.includes(1) && (
          <motion.g key="tank" initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
            <rect x="78" y="75" width="44" height="95" rx="10" fill="#2563eb" />
            <rect x="82" y="85" width="12" height="6" rx="2" fill="#93c5fd" opacity="0.7" />
            <rect x="82" y="97" width="12" height="6" rx="2" fill="#93c5fd" opacity="0.7" />
            <rect x="82" y="109" width="20" height="6" rx="2" fill="#93c5fd" opacity="0.4" />
            <text x="100" y="145" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#bfdbfe">FUEL</text>
            <ellipse cx="100" cy="170" rx="22" ry="8" fill="#1d4ed8" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Nose Cone — part 0 */}
      <AnimatePresence>
        {builtParts.includes(0) && (
          <motion.g key="nose" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
            <polygon points="100,12 78,76 122,76" fill="#dc2626" />
            <polygon points="100,12 100,76 122,76" fill="#b91c1c" opacity="0.5" />
            {/* Window */}
            <circle cx="100" cy="56" r="9" fill="#bfdbfe" />
            <circle cx="100" cy="56" r="7" fill="#eff6ff" />
            <ellipse cx="97" cy="53" rx="3" ry="2" fill="white" opacity="0.7" />
            <ellipse cx="100" cy="76" rx="22" ry="5" fill="#dc2626" opacity="0.4" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Placeholder outline when nothing built */}
      {builtParts.length === 0 && (
        <g opacity="0.15">
          <polygon points="100,12 78,76 122,76" fill="white" />
          <rect x="78" y="75" width="44" height="95" rx="10" fill="white" />
          <rect x="65" y="120" width="22" height="52" rx="6" fill="white" />
          <rect x="113" y="120" width="22" height="52" rx="6" fill="white" />
          <rect x="40" y="190" width="120" height="14" rx="4" fill="white" />
        </g>
      )}
    </svg>
  )
}

function GoalieSVG({ builtParts }) {
  return (
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Goal Net — part 4 */}
      <AnimatePresence>
        {builtParts.includes(4) && (
          <motion.g key="net" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x="10" y="60" width="180" height="110" rx="4" fill="none" stroke="#94a3b8" strokeWidth="2" />
            {[30,50,70,90,110,130,150,170].map(x => <line key={x} x1={x} y1="60" x2={x} y2="170" stroke="#64748b" strokeWidth="1" />)}
            {[80,100,120,140,160].map(y => <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="#64748b" strokeWidth="1" />)}
          </motion.g>
        )}
      </AnimatePresence>
      {/* Legs — part 3 */}
      <AnimatePresence>
        {builtParts.includes(3) && (
          <motion.g key="legs" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }}>
            <rect x="80" y="170" width="16" height="40" rx="5" fill="#1e40af" />
            <rect x="104" y="170" width="16" height="40" rx="5" fill="#1e40af" />
            <rect x="74" y="200" width="28" height="12" rx="4" fill="#1d4ed8" />
            <rect x="98" y="200" width="28" height="12" rx="4" fill="#1d4ed8" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Torso — part 2 */}
      <AnimatePresence>
        {builtParts.includes(2) && (
          <motion.g key="torso" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
            <rect x="72" y="110" width="56" height="64" rx="10" fill="#2563eb" />
            <rect x="80" y="120" width="40" height="8" rx="3" fill="#60a5fa" />
            <circle cx="88" cy="142" r="5" fill="#fbbf24" />
            <circle cx="112" cy="142" r="5" fill="#fbbf24" />
            <rect x="84" y="156" width="32" height="6" rx="2" fill="#1d4ed8" />
            {/* Jersey number */}
            <text x="100" y="155" textAnchor="middle" fontSize="14" fontWeight="900" fill="#bfdbfe">01</text>
          </motion.g>
        )}
      </AnimatePresence>
      {/* Arms — part 1 */}
      <AnimatePresence>
        {builtParts.includes(1) && (
          <motion.g key="arms" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ type: 'spring' }}>
            <rect x="32" y="112" width="42" height="14" rx="7" fill="#3b82f6" />
            <rect x="20" y="108" width="18" height="22" rx="7" fill="#2563eb" />
            <rect x="126" y="112" width="42" height="14" rx="7" fill="#3b82f6" />
            <rect x="162" y="108" width="18" height="22" rx="7" fill="#2563eb" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Head — part 0 */}
      <AnimatePresence>
        {builtParts.includes(0) && (
          <motion.g key="head" initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
            <rect x="78" y="70" width="44" height="44" rx="14" fill="#60a5fa" />
            <circle cx="91" cy="88" r="7" fill="white" />
            <circle cx="109" cy="88" r="7" fill="white" />
            <circle cx="92" cy="89" r="4" fill="#1e3a8a" />
            <circle cx="110" cy="89" r="4" fill="#1e3a8a" />
            <circle cx="93" cy="88" r="1.5" fill="white" />
            <circle cx="111" cy="88" r="1.5" fill="white" />
            <path d="M 90 103 Q 100 111 110 103" stroke="#1e3a8a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <rect x="88" y="68" width="24" height="8" rx="4" fill="#fbbf24" />
          </motion.g>
        )}
      </AnimatePresence>
      {builtParts.length === 0 && (
        <g opacity="0.12">
          <rect x="78" y="70" width="44" height="44" rx="14" fill="white" />
          <rect x="72" y="110" width="56" height="64" rx="10" fill="white" />
          <rect x="20" y="108" width="18" height="22" rx="7" fill="white" />
          <rect x="162" y="108" width="18" height="22" rx="7" fill="white" />
          <rect x="80" y="170" width="16" height="40" rx="5" fill="white" />
          <rect x="104" y="170" width="16" height="40" rx="5" fill="white" />
          <rect x="10" y="60" width="180" height="110" rx="4" fill="none" stroke="white" strokeWidth="2" />
        </g>
      )}
    </svg>
  )
}

function CatapultSVG({ builtParts }) {
  return (
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Base — part 0 */}
      <AnimatePresence>
        {builtParts.includes(0) && (
          <motion.g key="base" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }}>
            <rect x="20" y="170" width="160" height="20" rx="6" fill="#92400e" />
            <circle cx="50" cy="185" r="16" fill="#78350f" />
            <circle cx="50" cy="185" r="10" fill="#a16207" />
            <circle cx="150" cy="185" r="16" fill="#78350f" />
            <circle cx="150" cy="185" r="10" fill="#a16207" />
            <rect x="30" y="155" width="16" height="20" rx="3" fill="#92400e" />
            <rect x="154" y="155" width="16" height="20" rx="3" fill="#92400e" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Arm — part 1 */}
      <AnimatePresence>
        {builtParts.includes(1) && (
          <motion.g key="arm" initial={{ opacity: 0, rotate: 30, originX: '38px', originY: '150px' }} animate={{ opacity: 1, rotate: 0 }} transition={{ type: 'spring' }}>
            <rect x="34" y="70" width="14" height="100" rx="6" fill="#d97706" transform="rotate(-25 41 150)" />
            <circle cx="41" cy="152" r="10" fill="#b45309" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Counterweight — part 3 */}
      <AnimatePresence>
        {builtParts.includes(3) && (
          <motion.g key="weight" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
            <circle cx="58" cy="155" r="18" fill="#374151" />
            <circle cx="58" cy="155" r="12" fill="#4b5563" />
            <text x="58" y="160" textAnchor="middle" fontSize="10" fontWeight="900" fill="#9ca3af">10kg</text>
          </motion.g>
        )}
      </AnimatePresence>
      {/* Sling — part 2 */}
      <AnimatePresence>
        {builtParts.includes(2) && (
          <motion.g key="sling" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <line x1="22" y1="88" x2="38" y2="100" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="88" x2="38" y2="100" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="36" cy="86" rx="16" ry="10" fill="#92400e" />
            <circle cx="36" cy="82" r="10" fill="#d97706" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Trigger — part 4 */}
      <AnimatePresence>
        {builtParts.includes(4) && (
          <motion.g key="trigger" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring' }}>
            <rect x="140" y="148" width="40" height="10" rx="4" fill="#ef4444" />
            <rect x="155" y="138" width="10" height="22" rx="4" fill="#dc2626" />
            <circle cx="160" cy="136" r="8" fill="#fbbf24" />
            <text x="160" y="140" textAnchor="middle" fontSize="8" fontWeight="900" fill="#92400e">GO!</text>
          </motion.g>
        )}
      </AnimatePresence>
      {builtParts.length === 0 && (
        <g opacity="0.12">
          <rect x="20" y="170" width="160" height="20" rx="6" fill="white" />
          <rect x="34" y="70" width="14" height="100" rx="6" fill="white" transform="rotate(-25 41 150)" />
        </g>
      )}
    </svg>
  )
}

function SubSVG({ builtParts }) {
  return (
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Hull — part 0 */}
      <AnimatePresence>
        {builtParts.includes(0) && (
          <motion.g key="hull" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ type: 'spring' }}>
            <ellipse cx="100" cy="140" rx="80" ry="40" fill="#0369a1" />
            <ellipse cx="100" cy="140" rx="78" ry="38" fill="#0284c7" />
            <ellipse cx="68" cy="140" rx="12" ry="38" fill="#0369a1" />
            <ellipse cx="132" cy="140" rx="12" ry="38" fill="#0369a1" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Propeller — part 2 */}
      <AnimatePresence>
        {builtParts.includes(2) && (
          <motion.g key="prop" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} transition={{ type: 'spring' }}>
            <rect x="168" y="128" width="14" height="24" rx="4" fill="#374151" />
            <ellipse cx="175" cy="120" rx="6" ry="14" fill="#94a3b8" />
            <ellipse cx="175" cy="160" rx="6" ry="14" fill="#94a3b8" />
            <circle cx="175" cy="140" r="6" fill="#1e293b" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Hatch — part 3 */}
      <AnimatePresence>
        {builtParts.includes(3) && (
          <motion.g key="hatch" initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ type: 'spring' }}>
            <rect x="88" y="103" width="24" height="16" rx="4" fill="#0369a1" />
            <rect x="90" y="101" width="20" height="10" rx="4" fill="#0ea5e9" />
            <circle cx="100" cy="106" r="3" fill="#7dd3fc" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Periscope — part 1 */}
      <AnimatePresence>
        {builtParts.includes(1) && (
          <motion.g key="scope" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
            <rect x="97" y="50" width="8" height="56" rx="3" fill="#0369a1" />
            <rect x="90" y="50" width="22" height="10" rx="4" fill="#0369a1" />
            <rect x="88" y="44" width="12" height="12" rx="3" fill="#0284c7" />
            <circle cx="93" cy="50" r="5" fill="#7dd3fc" />
            {/* Viewing lens */}
            <circle cx="93" cy="50" r="3" fill="#1e3a8a" />
            <circle cx="92" cy="49" r="1" fill="white" opacity="0.7" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Torpedo Bay — part 4 */}
      <AnimatePresence>
        {builtParts.includes(4) && (
          <motion.g key="torpedo" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring' }}>
            <ellipse cx="30" cy="132" rx="14" ry="8" fill="#1e293b" />
            <ellipse cx="30" cy="148" rx="14" ry="8" fill="#1e293b" />
            <rect x="16" y="132" width="20" height="16" rx="2" fill="#1e293b" />
            {/* Torpedoes peeking out */}
            <rect x="8" y="128" width="24" height="8" rx="4" fill="#fbbf24" />
            <polygon points="8,132 4,130 4,136" fill="#f59e0b" />
            <rect x="8" y="144" width="24" height="8" rx="4" fill="#fbbf24" />
            <polygon points="8,148 4,146 4,152" fill="#f59e0b" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* Portholes (decorative, show when hull built) */}
      {builtParts.includes(0) && (
        <g>
          <circle cx="85" cy="140" r="9" fill="#0ea5e9" />
          <circle cx="85" cy="140" r="7" fill="#7dd3fc" />
          <circle cx="83" cy="138" r="2.5" fill="white" opacity="0.6" />
          <circle cx="115" cy="140" r="9" fill="#0ea5e9" />
          <circle cx="115" cy="140" r="7" fill="#7dd3fc" />
          <circle cx="113" cy="138" r="2.5" fill="white" opacity="0.6" />
        </g>
      )}
      {builtParts.length === 0 && (
        <g opacity="0.12">
          <ellipse cx="100" cy="140" rx="80" ry="40" fill="white" />
          <rect x="97" y="50" width="8" height="56" rx="3" fill="white" />
        </g>
      )}
    </svg>
  )
}

const BLUEPRINT_SVGS = [RocketSVG, GoalieSVG, CatapultSVG, SubSVG]

// ── Test Run Animations ──────────────────────────────────────────────────────

function RocketTestRun({ onDone }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0f0a2e 0%, #1e1b4b 40%, #312e81 100%)' }}>
      {/* Stars */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full bg-white"
          style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, top: `${Math.random() * 60}%`, left: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1 + Math.random() * 2, repeat: Infinity }} />
      ))}

      {/* Launch pad at bottom */}
      <motion.div className="absolute bottom-24 flex flex-col items-center"
        initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: 3.5, times: [0, 0.7, 1] }}>
        <div style={{ width: 100, height: 14, background: '#64748b', borderRadius: 6 }} />
      </motion.div>

      {/* Smoke clouds */}
      {[0,1,2].map(i => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ bottom: 90, left: `${40 + i * 10}%`, width: 40 + i * 20, height: 40 + i * 20, background: 'rgba(200,200,200,0.3)', filter: 'blur(12px)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 2.5], opacity: [0, 0.8, 0], y: [0, -40, -80] }}
          transition={{ duration: 2.5, delay: 0.5 + i * 0.2 }} />
      ))}

      {/* Rocket launching */}
      <motion.div className="absolute"
        style={{ bottom: 100 }}
        initial={{ y: 0 }}
        animate={{ y: [-0, -10, -700] }}
        transition={{ duration: 3.5, times: [0, 0.15, 1], ease: ['easeOut', 'easeIn'] }}>
        {/* Flame */}
        <motion.div className="flex justify-center mb-1"
          animate={{ scaleY: [0.8, 1.4, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.3, repeat: Infinity }}>
          <div style={{ width: 20, height: 40, background: 'linear-gradient(180deg, #fbbf24, #f97316, transparent)', borderRadius: '0 0 50% 50%', filter: 'blur(2px)' }} />
        </motion.div>
        <svg viewBox="0 0 80 130" style={{ width: 80, height: 130 }}>
          <polygon points="40,5 20,50 60,50" fill="#dc2626" />
          <rect x="20" y="49" width="40" height="60" rx="8" fill="#2563eb" />
          <circle cx="40" cy="38" r="8" fill="#bfdbfe" />
          <rect x="8" y="75" width="15" height="36" rx="5" fill="#7c3aed" />
          <rect x="57" y="75" width="15" height="36" rx="5" fill="#7c3aed" />
        </svg>
      </motion.div>

      {/* Celebration text */}
      <motion.div className="absolute text-center"
        style={{ bottom: 60 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
        <p className="text-4xl font-black text-white">🚀 LIFTOFF!</p>
        <p className="text-lg font-bold mt-2" style={{ color: '#a5b4fc' }}>Houston, we have ignition!</p>
      </motion.div>

      <motion.button onClick={onDone}
        className="absolute bottom-8 px-8 py-3 rounded-2xl font-black text-white text-lg"
        style={{ background: 'rgba(255,255,255,0.2)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}>
        ← Back to Lab
      </motion.button>
    </div>
  )
}

function GoalieTestRun({ onDone }) {
  const [phase, setPhase] = useState('ready') // ready → dive → saved

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #166534 0%, #15803d 100%)' }}>
      {/* Field markings */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'rgba(0,0,0,0.15)' }} />
      <div className="absolute" style={{ bottom: 120, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, border: '4px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} />

      {/* Goal post */}
      <div className="absolute" style={{ bottom: 120, left: '50%', transform: 'translateX(-50%)', width: 200 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 120, background: 'white' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: 120, background: 'white' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'white' }} />
        {/* Net lines */}
        {[30,60,90,120,150].map(x => <div key={x} style={{ position: 'absolute', top: 0, left: x, width: 2, height: 120, background: 'rgba(255,255,255,0.3)' }} />)}
        {[30,60,90].map(y => <div key={y} style={{ position: 'absolute', top: y, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.3)' }} />)}
      </div>

      {/* Soccer ball flying in */}
      {phase !== 'ready' && (
        <motion.div className="absolute text-5xl"
          style={{ top: '30%', right: -60 }}
          animate={phase === 'dive' ? { x: -280, y: 80, rotate: 720 } : { x: -200, y: 50 }}
          transition={{ duration: 0.8, ease: 'easeIn' }}>
          ⚽
        </motion.div>
      )}

      {/* Robot goalie */}
      <motion.div
        className="absolute"
        style={{ bottom: 120 }}
        animate={phase === 'dive' ? { x: 80, rotate: -30 } : { x: 0, rotate: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 400 }}>
        <svg viewBox="0 0 80 110" style={{ width: 80, height: 110 }}>
          <rect x="28" y="0" width="24" height="24" rx="8" fill="#60a5fa" />
          <circle cx="35" cy="11" r="5" fill="white" /><circle cx="36" cy="12" r="3" fill="#1e3a8a" />
          <circle cx="45" cy="11" r="5" fill="white" /><circle cx="46" cy="12" r="3" fill="#1e3a8a" />
          <rect x="28" y="20" width="24" height="8" rx="3" fill="#fbbf24" />
          <rect x="22" y="25" width="36" height="40" rx="8" fill="#2563eb" />
          <rect x="0" y="27" width="24" height="10" rx="5" fill="#3b82f6" />
          <rect x="56" y="27" width="24" height="10" rx="5" fill="#3b82f6" />
          <rect x="28" y="65" width="10" height="35" rx="5" fill="#1e40af" />
          <rect x="42" y="65" width="10" height="35" rx="5" fill="#1e40af" />
          <text x="40" y="52" textAnchor="middle" fontSize="10" fontWeight="900" fill="#bfdbfe">01</text>
        </svg>
      </motion.div>

      {/* Status */}
      {phase === 'ready' && (
        <motion.div className="absolute text-center" style={{ top: '15%' }}
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-3xl font-black text-white mb-6">🤖 Robot Goalie Online!</p>
          <motion.button onClick={() => { setPhase('dive'); setTimeout(() => setPhase('saved'), 1000) }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl text-xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.5)' }}>
            ⚽ SHOOT!
          </motion.button>
        </motion.div>
      )}

      {phase === 'saved' && (
        <motion.div className="absolute text-center" style={{ top: '15%' }}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
          <p className="text-4xl font-black text-white">🧤 SAVED!</p>
          <p className="text-lg font-bold mt-2" style={{ color: '#86efac' }}>The robot blocked it!</p>
          <button onClick={onDone} className="mt-6 px-8 py-3 rounded-2xl font-black text-white text-lg"
            style={{ background: 'rgba(255,255,255,0.2)' }}>← Back to Lab</button>
        </motion.div>
      )}
    </div>
  )
}

function CatapultTestRun({ onDone }) {
  const [fired, setFired] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1c1917 0%, #292524 100%)' }}>
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: '#57534e' }} />
      <div className="absolute" style={{ bottom: 94, left: 0, right: 0, height: 4, background: '#78716c' }} />

      {/* Target */}
      <motion.div className="absolute" style={{ bottom: 96, right: '15%' }}
        animate={fired ? { x: 0 } : {}}>
        {['#ef4444','#fbbf24','#22c55e'].map((c, i) => (
          <div key={i} className="absolute rounded-full border-4 border-white"
            style={{ width: 60 - i*16, height: 60 - i*16, background: c, top: (i*8), left: (i*8) }} />
        ))}
      </motion.div>

      {/* Projectile */}
      {fired && (
        <motion.div className="absolute text-3xl"
          style={{ bottom: 130, left: '20%' }}
          initial={{ x: 0, y: 0 }}
          animate={{ x: 300, y: [-80, -150, -80, 0, 20] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          onAnimationComplete={() => setTimeout(() => {}, 500)}>
          🪨
        </motion.div>
      )}

      {/* Catapult SVG */}
      <div className="absolute" style={{ bottom: 96, left: '12%', width: 140, height: 120 }}>
        <motion.svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%' }}
          animate={fired ? { scaleX: [-1, 1] } : {}} transition={{ duration: 0.1 }}>
          <rect x="20" y="120" width="160" height="16" rx="5" fill="#92400e" />
          <circle cx="50" cy="130" r="14" fill="#78350f" />
          <circle cx="50" cy="130" r="8" fill="#a16207" />
          <circle cx="150" cy="130" r="14" fill="#78350f" />
          <circle cx="150" cy="130" r="8" fill="#a16207" />
          <motion.rect x="36" y="30" width="12" height="95" rx="5" fill="#d97706"
            animate={fired ? { rotate: [0, -70] } : { rotate: 0 }}
            style={{ originX: '42px', originY: '120px' }}
            transition={{ duration: 0.4 }} />
          <circle cx="42" cy="122" r="9" fill="#b45309" />
          <circle cx="56" cy="110" r="16" fill="#374151" />
          <circle cx="56" cy="110" r="10" fill="#4b5563" />
        </motion.svg>
      </div>

      {/* HIT! */}
      {fired && (
        <motion.div className="absolute text-center" style={{ right: '8%', top: '20%' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, type: 'spring' }}>
          <p className="text-5xl font-black text-yellow-400">💥</p>
          <p className="text-2xl font-black text-white">BULLSEYE!</p>
        </motion.div>
      )}

      <div className="absolute text-center" style={{ top: '12%' }}>
        <p className="text-3xl font-black text-white mb-6">⚙️ LEGO Catapult Ready!</p>
        {!fired ? (
          <motion.button onClick={() => setFired(true)} whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl text-xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.5)' }}>
            🔴 FIRE!
          </motion.button>
        ) : (
          <motion.button onClick={onDone} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
            className="px-8 py-3 rounded-2xl font-black text-white text-lg mt-4"
            style={{ background: 'rgba(255,255,255,0.2)' }}>← Back to Lab</motion.button>
        )}
      </div>
    </div>
  )
}

function SubTestRun({ onDone }) {
  const [phase, setPhase] = useState('surface') // surface → diving → underwater

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: phase === 'underwater' ? 'linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)' : 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 50%, #0c4a6e 100%)' }}>
      {/* Bubbles when underwater */}
      {phase === 'underwater' && Array.from({ length: 12 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: 6 + Math.random() * 10, height: 6 + Math.random() * 10, left: `${10 + Math.random() * 80}%`, bottom: Math.random() * 60 + '%', background: 'rgba(125,211,252,0.4)', border: '1px solid rgba(125,211,252,0.6)' }}
          animate={{ y: -200, opacity: [0.6, 0] }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
      ))}

      {/* Water surface line */}
      <div className="absolute w-full" style={{ top: '45%', height: 3, background: 'rgba(125,211,252,0.5)' }} />

      {/* Submarine */}
      <motion.div className="absolute"
        style={{ left: '5%' }}
        animate={phase === 'diving' ? { y: 200, x: 80 } : phase === 'underwater' ? { x: [80, 400] } : { y: 0 }}
        transition={{ duration: phase === 'underwater' ? 3 : 1.5, ease: 'easeInOut' }}>
        <svg viewBox="0 0 200 100" style={{ width: 180, height: 90 }}>
          <ellipse cx="100" cy="60" rx="80" ry="32" fill="#0369a1" />
          <ellipse cx="100" cy="60" rx="78" ry="30" fill="#0284c7" />
          <rect x="94" y="30" width="8" height="32" rx="3" fill="#0369a1" />
          <rect x="87" y="28" width="22" height="8" rx="3" fill="#0369a1" />
          <rect x="85" y="22" width="12" height="10" rx="3" fill="#0284c7" />
          <circle cx="80" cy="60" r="10" fill="#0ea5e9" /><circle cx="80" cy="60" r="7" fill="#7dd3fc" />
          <circle cx="120" cy="60" r="10" fill="#0ea5e9" /><circle cx="120" cy="60" r="7" fill="#7dd3fc" />
          <rect x="164" y="48" width="12" height="24" rx="3" fill="#374151" />
          <ellipse cx="170" cy="42" rx="5" ry="12" fill="#94a3b8" />
          <ellipse cx="170" cy="78" rx="5" ry="12" fill="#94a3b8" />
          <rect x="10" y="52" width="20" height="7" rx="3" fill="#fbbf24" />
          <polygon points="10,55 5,53 5,58" fill="#f59e0b" />
          <rect x="10" y="62" width="20" height="7" rx="3" fill="#fbbf24" />
          <polygon points="10,66 5,64 5,69" fill="#f59e0b" />
        </svg>
      </motion.div>

      <div className="absolute text-center" style={{ top: '10%' }}>
        <p className="text-3xl font-black text-white mb-4">🌊 Mini Submarine Ready!</p>
        {phase === 'surface' && (
          <motion.button onClick={() => { setPhase('diving'); setTimeout(() => setPhase('underwater'), 1600) }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl text-xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)', boxShadow: '0 8px 24px rgba(3,105,161,0.5)' }}>
            🤿 DIVE!
          </motion.button>
        )}
        {phase === 'underwater' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-xl font-bold mb-4" style={{ color: '#7dd3fc' }}>🐠 Exploring the deep sea!</p>
            <button onClick={onDone} className="px-8 py-3 rounded-2xl font-black text-white text-lg"
              style={{ background: 'rgba(255,255,255,0.2)' }}>← Back to Lab</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

const TEST_RUNS = [RocketTestRun, GoalieTestRun, CatapultTestRun, SubTestRun]

// ── Main Build Room ──────────────────────────────────────────────────────────

export default function BuildRoom({ currency, blueprintState, onClose, onUpdate }) {
  const [selectedBlueprint, setSelectedBlueprint] = useState(0)
  const [testRunning, setTestRunning] = useState(false)
  const [justBuilt, setJustBuilt] = useState(null)

  const blueprint = BLUEPRINTS[selectedBlueprint]
  const builtParts = blueprintState[blueprint.id] || []
  const isComplete = builtParts.length === blueprint.parts.length

  function buyPart(partIdx) {
    if (builtParts.includes(partIdx)) return
    if (currency.bolts < 3 || currency.bricks < 1) return
    const newCurrency = { bolts: currency.bolts - 3, bricks: currency.bricks - 1 }
    const newState = { ...blueprintState, [blueprint.id]: [...builtParts, partIdx] }
    saveCurrency(newCurrency)
    saveBlueprintState(newState)
    setJustBuilt(partIdx)
    setTimeout(() => setJustBuilt(null), 800)
    onUpdate(newCurrency, newState)
  }

  const BlueprintSVG = BLUEPRINT_SVGS[selectedBlueprint]
  const TestRun = TEST_RUNS[selectedBlueprint]

  const canAfford = currency.bolts >= 3 && currency.bricks >= 1

  return (
    <>
      {/* Test Run overlay */}
      <AnimatePresence>
        {testRunning && <TestRun onDone={() => setTestRunning(false)} />}
      </AnimatePresence>

      <div className="flex flex-col min-h-screen px-4 py-6 max-w-sm mx-auto gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🏗️ BUILD ROOM</h1>
            <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>Snap parts · Watch it work!</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <span>⚡</span><span className="font-black text-yellow-300">{currency.bolts}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(251,113,133,0.15)' }}>
              <span>🧱</span><span className="font-black text-pink-300">{currency.bricks}</span>
            </div>
          </div>
        </div>

        {/* Blueprint tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {BLUEPRINTS.map((bp, i) => {
            const parts = blueprintState[bp.id] || []
            const pct = Math.round(parts.length / bp.parts.length * 100)
            const locked = i > 0 && !(blueprintState[BLUEPRINTS[i - 1].id]?.length === BLUEPRINTS[i - 1].parts.length)
            return (
              <motion.button key={bp.id} onClick={() => !locked && setSelectedBlueprint(i)}
                whileTap={!locked ? { scale: 0.9 } : {}}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-20 relative"
                style={{ background: selectedBlueprint === i ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)', border: selectedBlueprint === i ? '2px solid #6366f1' : '2px solid transparent', opacity: locked ? 0.4 : 1 }}>
                {locked && <div className="absolute inset-0 flex items-center justify-center text-xl rounded-2xl" style={{ background: 'rgba(0,0,0,0.6)' }}>🔒</div>}
                <span className="text-2xl">{bp.emoji}</span>
                <span className="text-xs font-black" style={{ color: pct === 100 ? '#34d399' : '#e2e8f0' }}>{pct === 100 ? '✓ Done' : `${pct}%`}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Blueprint name */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{blueprint.emoji} {blueprint.name}</h2>
            <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>{builtParts.length}/{blueprint.parts.length} parts assembled</p>
          </div>
          {isComplete && <span className="text-xs font-black px-3 py-1.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>✓ COMPLETE</span>}
        </div>

        {/* SVG Assembly View */}
        <div className="w-full rounded-3xl overflow-hidden relative"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, rgba(0,0,0,0.4) 100%)', border: '2px solid rgba(255,255,255,0.08)', height: 220 }}>
          {/* Blueprint grid lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
            {Array.from({ length: 10 }).map((_, i) => <line key={`h${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="white" strokeWidth="1" />)}
            {Array.from({ length: 10 }).map((_, i) => <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="white" strokeWidth="1" />)}
          </svg>

          <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '8px 24px' }}>
            <BlueprintSVG builtParts={builtParts} />
          </div>

          {builtParts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Buy parts below<br />to assemble your {blueprint.name}!
              </p>
            </div>
          )}
        </div>

        {/* Parts snap list */}
        <div className="flex flex-col gap-2">
          {blueprint.parts.map((part, i) => {
            const built = builtParts.includes(i)
            const isJustBuilt = justBuilt === i
            return (
              <motion.button key={i} onClick={() => !built && buyPart(i)}
                whileTap={!built && canAfford ? { scale: 0.96 } : {}}
                animate={isJustBuilt ? { scale: [1, 1.05, 1], borderColor: ['#34d399', '#34d399', 'transparent'] } : {}}
                className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ background: built ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)', border: built ? '2px solid rgba(34,197,94,0.3)' : '2px solid rgba(255,255,255,0.08)', cursor: built ? 'default' : 'pointer' }}>
                <div className="flex items-center gap-3">
                  <motion.div className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-black"
                    animate={isJustBuilt ? { rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] } : {}}
                    style={{ background: built ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)', color: built ? '#34d399' : '#64748b' }}>
                    {built ? '✓' : i + 1}
                  </motion.div>
                  <span className="text-sm font-black text-white">{part}</span>
                </div>
                {!built && (
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: canAfford ? '#a5b4fc' : '#f87171' }}>
                    <span>⚡3</span><span>🧱1</span>
                  </div>
                )}
                {built && <span className="text-xs font-bold" style={{ color: '#34d399' }}>SNAPPED IN ✓</span>}
              </motion.button>
            )
          })}
        </div>

        {!canAfford && !isComplete && (
          <p className="text-center text-sm font-bold" style={{ color: '#f87171' }}>
            Need ⚡3 + 🧱1 per part — complete missions to earn more!
          </p>
        )}

        {/* Test Run button */}
        {isComplete ? (
          <motion.button onClick={() => setTestRunning(true)} whileTap={{ scale: 0.95 }}
            animate={{ boxShadow: ['0 0 10px rgba(251,191,36,0.4)', '0 0 30px rgba(251,191,36,0.8)', '0 0 10px rgba(251,191,36,0.4)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-full py-5 rounded-2xl text-xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            🚀 TEST RUN — See It Work!
          </motion.button>
        ) : (
          <div className="text-center p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Assemble all {blueprint.parts.length} parts to unlock TEST RUN!
            </p>
          </div>
        )}

        {/* Next blueprint teaser */}
        {isComplete && selectedBlueprint + 1 < BLUEPRINTS.length && (
          <div className="text-center p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>🔓 Next unlock:</p>
            <p className="text-base font-black text-white">{BLUEPRINTS[selectedBlueprint + 1].emoji} {BLUEPRINTS[selectedBlueprint + 1].name}</p>
          </div>
        )}

        <button onClick={onClose} className="w-full py-3 rounded-2xl font-bold" style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
          ← Back to Lab
        </button>
      </div>
    </>
  )
}
