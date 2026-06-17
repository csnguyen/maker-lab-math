/**
 * Lego Garage — between-race customization workshop.
 * Players spend earned coins on car parts gated by cross-game math mastery.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PARTS, computeCarStats,
  canAfford, masteryUnlocked, isOwned, isEquipped,
} from '../engine/garage.js'
import { SKILLS } from '../engine/curriculum.js'

// ── Car preview (shows installed-part icons) ───────────────────────────────────
function CarPreview({ equippedCar, playerName }) {
  const icons = PARTS.filter(p => isEquipped(equippedCar, p)).map(p => p.icon)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Car body */}
      <div style={{ position: 'relative', width: 80, height: 110 }}>
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 80, height: 110, borderRadius: 14,
            background: 'linear-gradient(160deg, #60a5fa, #3b82f6)',
            border: '3px solid rgba(96,165,250,0.6)',
            boxShadow: '0 8px 24px rgba(96,165,250,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}
        >
          🚗
        </motion.div>
        {/* Part icons floating */}
        {icons.map((ico, i) => (
          <motion.div key={i}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: i * 26 - 8,
              right: -20,
              fontSize: 16,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: 8,
              padding: '2px 4px',
            }}
          >
            {ico}
          </motion.div>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
        {playerName}'s Racer
      </div>
    </div>
  )
}

// ── Mastery gate bar ────────────────────────────────────────────────────────────
function MasteryGate({ req, globalMastery }) {
  if (!req) return null
  const current = globalMastery[req.skillId] ?? 0
  const pct     = Math.round(current * 100)
  const needed  = Math.round(req.minScore * 100)
  const met     = current >= req.minScore
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>
        <span style={{ color: met ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>{req.label}</span>
        <span style={{ color: met ? '#4ade80' : '#fca5a5' }}>{pct}% / {needed}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.min(100, pct)}%`,
          background: met ? '#22c55e' : '#f59e0b',
          transition: 'width 0.4s',
        }} />
      </div>
    </div>
  )
}

// ── Single upgrade card ────────────────────────────────────────────────────────
function PartCard({ part, coins, equippedCar, ownedParts, globalMastery, onBuy, onEquip }) {
  const owned    = isOwned(ownedParts, part.id)
  const equipped = isEquipped(equippedCar, part)
  const unlocked = masteryUnlocked(globalMastery, part)
  const afford   = canAfford(coins, part)
  const [flash,  setFlash] = useState(null)

  function handleBuy() {
    if (!afford)   { setFlash('need-coins'); setTimeout(() => setFlash(null), 900); return }
    if (!unlocked) return
    onBuy(part.id, part.price)
    setFlash('bought')
    setTimeout(() => setFlash(null), 1200)
  }

  function handleEquip() {
    onEquip(part.slot, equipped ? null : part.id)
  }

  const borderColor = equipped ? '#22c55e'
    : !unlocked ? '#374151'
    : owned ? '#3b82f6'
    : 'rgba(255,255,255,0.12)'

  const bgColor = equipped ? 'rgba(34,197,94,0.12)'
    : !unlocked ? 'rgba(255,255,255,0.03)'
    : 'rgba(255,255,255,0.06)'

  return (
    <motion.div
      whileTap={!unlocked ? {} : { scale: 0.97 }}
      style={{
        borderRadius: 18, padding: '14px 14px 12px',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column', gap: 6,
        opacity: !unlocked ? 0.6 : 1,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 10,
              background: flash === 'bought' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
              fontSize: 24, fontWeight: 900,
            }}
          >
            {flash === 'bought' ? '✓ Bought!' : '💰 Need more coins'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{part.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: equipped ? '#4ade80' : 'white' }}>
            {part.name}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
            {part.tagline}
          </div>
        </div>
        {equipped && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: '#4ade80',
              background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 8 }}>
            ON
          </motion.div>
        )}
      </div>

      {/* Mastery gate */}
      {part.masteryReq && <MasteryGate req={part.masteryReq} globalMastery={globalMastery} />}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        {!owned && (
          <motion.button whileTap={{ scale: 0.93 }}
            onPointerDown={handleBuy}
            disabled={!unlocked}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 10, fontWeight: 900,
              fontSize: 12, cursor: unlocked ? 'pointer' : 'not-allowed',
              color: unlocked && afford ? 'white' : 'rgba(255,255,255,0.35)',
              background: unlocked && afford ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${unlocked && afford ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {!unlocked ? `🔒 Locked` : `🪙 ${part.price}`}
          </motion.button>
        )}
        {owned && (
          <motion.button whileTap={{ scale: 0.93 }}
            onPointerDown={handleEquip}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 10, fontWeight: 900,
              fontSize: 12, cursor: 'pointer', color: 'white',
              background: equipped
                ? 'rgba(239,68,68,0.2)'
                : 'linear-gradient(135deg,#22c55e,#16a34a)',
              border: `1.5px solid ${equipped ? '#ef4444' : '#16a34a'}`,
            }}
          >
            {equipped ? '⏏ Remove' : '⚙ Install'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ── Stats summary bar ──────────────────────────────────────────────────────────
function StatsBar({ equippedCar }) {
  const stats = computeCarStats(equippedCar)
  const pct   = v => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}%`

  return (
    <div style={{
      display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)',
      borderRadius: 14, padding: '10px 14px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {[
        { label: 'SPEED',   value: stats.speedMult,    color: '#f59e0b' },
        { label: 'BOOST',   value: stats.boostMult,    color: '#60a5fa' },
        { label: 'GRIP',    value: 2 - stats.fishtailMult, color: '#22c55e' }, // invert: lower fishtail = more grip
      ].map(s => (
        <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{pct(s.value)}</div>
        </div>
      ))}
    </div>
  )
}

// ── Garage screen ──────────────────────────────────────────────────────────────
export default function Garage({ playerName, coins, equippedCar, ownedParts, globalMastery, onBuy, onEquip, onBack }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg,#0a0a1a 0%,#0f0a00 60%,#0a0a1a 100%)',
      padding: '0 0 20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 8px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <motion.button whileTap={{ scale: 0.95 }} onPointerDown={onBack}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '6px 14px', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          ← Back
        </motion.button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', letterSpacing: 2 }}>🔧 LEGO GARAGE</div>
        </div>
        <div style={{ background: 'rgba(251,191,36,0.15)', border: '1.5px solid rgba(251,191,36,0.3)',
          borderRadius: 12, padding: '6px 14px', fontSize: 15, fontWeight: 900, color: '#fbbf24' }}>
          🪙 {coins}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Car preview + stats */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <CarPreview equippedCar={equippedCar} playerName={playerName} />
          <div style={{ flex: 1 }}>
            <StatsBar equippedCar={equippedCar} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>
              Install parts to boost your race stats
            </p>
          </div>
        </div>

        {/* Parts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PARTS.slice(0, 4).map(part => (
            <PartCard key={part.id} part={part}
              coins={coins} equippedCar={equippedCar} ownedParts={ownedParts}
              globalMastery={globalMastery} onBuy={onBuy} onEquip={onEquip} />
          ))}
        </div>

        {/* Twin-Turbo: full width premium card */}
        <PartCard part={PARTS[4]}
          coins={coins} equippedCar={equippedCar} ownedParts={ownedParts}
          globalMastery={globalMastery} onBuy={onBuy} onEquip={onEquip} />

        {/* Math mastery hint */}
        <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 14, padding: '12px 14px',
          border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            💡 Unlock advanced parts by mastering math concepts in races.
            Progress from Maker Lab also counts here!
          </p>
        </div>
      </div>
    </div>
  )
}
