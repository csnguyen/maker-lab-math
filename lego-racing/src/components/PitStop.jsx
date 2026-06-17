/**
 * PitStop — shown when a student misses the same concept twice in a row.
 * Pauses the race, shows an interactive visual scaffold, then awards a
 * mega-boost on a correct multiple-choice answer.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Visual scaffold components ─────────────────────────────────────────────────

const BRICK_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899']

function ArrayGrid({ rows, cols }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 }}>
        {rows} rows of {cols}
      </p>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <motion.div
              key={c}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: (r * cols + c) * 0.03, type: 'spring', stiffness: 300 }}
              style={{
                width: Math.min(28, 200 / cols),
                height: Math.min(28, 200 / cols),
                borderRadius: 5,
                background: BRICK_COLORS[r % BRICK_COLORS.length],
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function AddBlocks({ a, b }) {
  const maxDots = 20
  const showA = Math.min(a, maxDots)
  const showB = Math.min(b, maxDots - showA)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 220, justifyContent: 'center' }}>
        {Array.from({ length: showA }).map((_, i) => (
          <motion.div key={`a${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 350 }}
            style={{ width: 22, height: 22, borderRadius: 4, background: '#3b82f6', border: '2px solid rgba(255,255,255,0.3)' }} />
        ))}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>+</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 220, justifyContent: 'center' }}>
        {Array.from({ length: showB }).map((_, i) => (
          <motion.div key={`b${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: showA * 0.04 + i * 0.04, type: 'spring', stiffness: 350 }}
            style={{ width: 22, height: 22, borderRadius: 4, background: '#22c55e', border: '2px solid rgba(255,255,255,0.3)' }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
        {showA} blue + {showB} green = ?
      </div>
    </div>
  )
}

function SubBlocks({ a, b }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 220, justifyContent: 'center' }}>
        {Array.from({ length: Math.min(a, 20) }).map((_, i) => (
          <motion.div key={i}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 350 }}
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: i >= a - b ? 'rgba(239,68,68,0.35)' : '#3b82f6',
              border: `2px solid ${i >= a - b ? '#ef4444' : 'rgba(255,255,255,0.3)'}`,
              position: 'relative',
            }}>
            {i >= a - b && (
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#ef4444' }}>×</span>
            )}
          </motion.div>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
        {a} total — cross out {b} → ? left
      </div>
    </div>
  )
}

function FractionBar({ numerator, denominator }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 3, width: 200 }}>
        {Array.from({ length: denominator }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
            style={{
              flex: 1, height: 40,
              background: i < numerator ? '#3b82f6' : 'rgba(255,255,255,0.08)',
              border: '2px solid rgba(255,255,255,0.25)',
              borderRadius: 5,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
        {numerator} out of {denominator} parts shaded = ?
      </div>
    </div>
  )
}

function VisualScaffold({ visual }) {
  if (!visual) return null
  switch (visual.type) {
    case 'array_grid':   return <ArrayGrid rows={visual.rows} cols={visual.cols} />
    case 'add_blocks':   return <AddBlocks a={visual.a} b={visual.b} />
    case 'sub_blocks':   return <SubBlocks a={visual.a} b={visual.b} />
    case 'fraction_bar': return <FractionBar numerator={visual.numerator} denominator={visual.denominator} />
    default:             return null
  }
}

// ── Generate wrong choices ─────────────────────────────────────────────────────
function makeChoices(answer) {
  const choices = new Set([answer])
  const deltas = [-3, -2, -1, 1, 2, 3, 4, -4, 5, -5]
  for (const d of deltas) {
    const c = answer + d
    if (c > 0 && c !== answer) choices.add(c)
    if (choices.size >= 3) break
  }
  return [...choices].sort((a, b) => a - b)
}

// ── PitStop component ──────────────────────────────────────────────────────────
export default function PitStop({ question, onComplete }) {
  const [selected, setSelected]   = useState(null)
  const [shaking, setShaking]     = useState(false)

  const choices = makeChoices(question.answer)

  function handleChoice(c) {
    if (selected !== null) return
    setSelected(c)
    if (c === question.answer) {
      setTimeout(() => onComplete(true), 900)
    } else {
      setShaking(true)
      setTimeout(() => { setSelected(null); setShaking(false) }, 700)
    }
  }

  const isCorrect = selected === question.answer

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.82)', padding: 16 }}
    >
      <motion.div
        initial={{ y: 40, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        style={{
          width: '100%', maxWidth: 360,
          background: 'linear-gradient(160deg, #0d0a24, #1a0850)',
          border: '2px solid rgba(251,191,36,0.4)',
          borderRadius: 24, padding: 24,
          boxShadow: '0 8px 40px rgba(251,191,36,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <motion.div
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ fontSize: 40 }}
          >
            🔧
          </motion.div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
            PIT STOP!
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Let's look at this together
          </p>
        </div>

        {/* Question */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '10px 16px',
          textAlign: 'center', marginBottom: 16,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>
            {question.prompt} = ?
          </span>
        </div>

        {/* Visual scaffold */}
        <div style={{ marginBottom: 18, padding: '12px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 14 }}>
          <VisualScaffold visual={question.visual} />
        </div>

        {/* Multiple-choice buttons */}
        <motion.div
          animate={shaking ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
        >
          {choices.map(c => {
            const isSelected = selected === c
            const isRight = isSelected && c === question.answer
            const isWrong = isSelected && c !== question.answer
            return (
              <motion.button
                key={c}
                whileTap={{ scale: 0.92 }}
                onPointerDown={() => handleChoice(c)}
                style={{
                  padding: '14px 0', borderRadius: 14,
                  fontWeight: 900, fontSize: 22, color: 'white',
                  cursor: 'pointer', border: '2px solid',
                  borderColor: isRight ? '#22c55e' : isWrong ? '#ef4444' : 'rgba(255,255,255,0.15)',
                  background: isRight ? 'rgba(34,197,94,0.25)' : isWrong ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.15s',
                }}
              >
                {c}
              </motion.button>
            )
          })}
        </motion.div>

        {/* Success message */}
        <AnimatePresence>
          {isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', marginTop: 14, fontSize: 15, fontWeight: 900, color: '#4ade80' }}
            >
              🚀 Got it! Mega boost activated!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
