import { motion } from 'framer-motion'

const COLORS = ['#60a5fa','#34d399','#f472b6','#fbbf24','#a78bfa','#f87171','#22d3ee','#fb923c']

// ── TEN FRAME ─────────────────────────────────────────────────────────────────
// RSM-style: shows addition via two-color dot filling, subtraction via cross-out
function TenFrame({ a = 0, b = 0, mode = 'add' }) {
  const useDouble = mode === 'subtract' ? a > 10 : a + b > 10
  const frames = useDouble ? [0, 1] : [0]

  const getCellState = (idx) => {
    if (mode === 'subtract') {
      if (idx >= a) return 'empty'
      if (idx >= a - b) return 'removed'
      return 'base'
    }
    if (idx < a) return 'first'
    if (idx < a + b) return 'second'
    return 'empty'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col gap-2">
        {frames.map(fi => {
          const offset = fi * 10
          return (
            <div key={fi} className="p-2 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.12)' }}>
              {[[0,1,2,3,4],[5,6,7,8,9]].map((row, ri) => (
                <div key={ri} className="flex gap-1.5 mb-1.5 last:mb-0">
                  {row.map(col => {
                    const idx = offset + col
                    const state = getCellState(idx)
                    const isActive = state !== 'empty'
                    const delay =
                      state === 'second' ? 0.45 + (idx - a) * 0.07
                      : state === 'removed' ? 0.35 + (idx - (a - b)) * 0.07
                      : idx * 0.05
                    const bg =
                      state === 'first' || state === 'base' ? '#60a5fa'
                      : state === 'second' ? '#f472b6'
                      : state === 'removed' ? 'rgba(239,68,68,0.35)'
                      : 'rgba(255,255,255,0.06)'
                    const border =
                      state === 'first' || state === 'base' ? '#3b82f6'
                      : state === 'second' ? '#ec4899'
                      : state === 'removed' ? '#ef4444'
                      : 'rgba(255,255,255,0.14)'
                    return (
                      <motion.div key={col}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay, type: 'spring', stiffness: 420, damping: 18 }}
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: bg, border: `2px solid ${border}`,
                          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {state === 'removed' && (
                          <span style={{ color: '#fca5a5', fontWeight: 900, fontSize: 13 }}>✕</span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="flex gap-5 text-xs font-black mt-0.5">
        {mode === 'add' && <>
          <span style={{ color: '#93c5fd' }}>● {a}</span>
          <span style={{ color: '#94a3b8' }}>+</span>
          <span style={{ color: '#f9a8d4' }}>● {b}</span>
        </>}
        {mode === 'subtract' && <>
          <span style={{ color: '#93c5fd' }}>● {a} total</span>
          <span style={{ color: '#94a3b8' }}>−</span>
          <span style={{ color: '#fca5a5' }}>✕ {b} removed</span>
        </>}
      </div>
    </div>
  )
}

// ── NUMBER BOND (Part-Part-Whole) ─────────────────────────────────────────────
// RSM staple: shows the relationship between a whole and its two parts
function NumberBond({ whole, partA, partB }) {
  const unknownA = partA === null || partA === undefined
  const unknownB = partB === null || partB === undefined
  return (
    <motion.svg viewBox="0 0 220 148" width={220} height={148}
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      {/* Connector lines */}
      <motion.line x1="110" y1="50" x2="60" y2="108"
        stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2 }} />
      <motion.line x1="110" y1="50" x2="160" y2="108"
        stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2 }} />

      {/* WHOLE — top circle */}
      <motion.circle cx="110" cy="28" r="26" fill="#312e81" stroke="#a78bfa" strokeWidth="3"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }} />
      <text x="110" y="34" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">{whole}</text>
      <text x="110" y="10" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700">WHOLE</text>

      {/* PART A — left circle */}
      <motion.circle cx="60" cy="118" r="23" fill="#1e3a5f" stroke={unknownA ? '#f472b6' : '#60a5fa'} strokeWidth="3"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}>
        {unknownA && <animate attributeName="opacity" values="0.7;1;0.7" dur="1.4s" repeatCount="indefinite" />}
      </motion.circle>
      <text x="60" y="124" textAnchor="middle"
        fill={unknownA ? '#f472b6' : 'white'} fontSize={unknownA ? '20' : '16'} fontWeight="900">
        {unknownA ? '?' : partA}
      </text>

      {/* PART B — right circle */}
      <motion.circle cx="160" cy="118" r="23" fill="#1e3a5f" stroke={unknownB ? '#f472b6' : '#60a5fa'} strokeWidth="3"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}>
        {unknownB && <animate attributeName="opacity" values="0.7;1;0.7" dur="1.4s" repeatCount="indefinite" />}
      </motion.circle>
      <text x="160" y="124" textAnchor="middle"
        fill={unknownB ? '#f472b6' : 'white'} fontSize={unknownB ? '20' : '16'} fontWeight="900">
        {unknownB ? '?' : partB}
      </text>

      <text x="35" y="146" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="700">PART</text>
      <text x="186" y="146" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="700">PART</text>
    </motion.svg>
  )
}

// ── BALANCE SCALE ─────────────────────────────────────────────────────────────
// RSM algebra intuition: equations as a balance
function BalanceScale({ leftLabel, rightLabel, phase }) {
  const balanced = phase === 'result'
  return (
    <motion.svg viewBox="0 0 280 170" width={280} height={170}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Fulcrum */}
      <polygon points="140,128 126,156 154,156" fill="#64748b" />
      <rect x="118" y="155" width="44" height="9" rx="4" fill="#475569" />

      {/* Beam */}
      <motion.rect x="28" y="122" width="224" height="7" rx="3.5" fill="#94a3b8"
        animate={{ rotate: 0 }} />

      {/* Left chain */}
      <line x1="54" y1="122" x2="54" y2="96" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="4 2" />
      {/* Right chain */}
      <line x1="226" y1="122" x2="226" y2="96" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="4 2" />

      {/* Left pan */}
      <motion.ellipse cx="54" cy="93" rx="42" ry="16"
        fill="#1e3a5f" stroke={balanced ? '#34d399' : '#60a5fa'} strokeWidth="2.5"
        animate={{ stroke: balanced ? '#34d399' : '#60a5fa' }} />
      <text x="54" y="98" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">{leftLabel}</text>

      {/* Right pan */}
      <motion.ellipse cx="226" cy="93" rx="42" ry="16"
        fill="#1e3a5f" stroke={balanced ? '#34d399' : '#60a5fa'} strokeWidth="2.5"
        animate={{ stroke: balanced ? '#34d399' : '#60a5fa' }} />
      <text x="226" y="98" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">{rightLabel}</text>

      {/* Balance indicator */}
      {balanced && (
        <motion.text x="140" y="60" textAnchor="middle" fill="#34d399"
          fontSize="13" fontWeight="900"
          initial={{ opacity: 0, y: 70 }} animate={{ opacity: 1, y: 60 }}>
          ⚖️ BALANCED!
        </motion.text>
      )}

      {/* "=" hint when not solved */}
      {!balanced && (
        <text x="140" y="108" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="11" fontWeight="700">?</text>
      )}
    </motion.svg>
  )
}

// ── ARRAY GRID (multiplication as equal groups) ───────────────────────────────
// Beast Academy style: multiplication = rows of equal-sized groups
function ArrayGrid({ rows = 3, cols = 4, highlightGroup = true }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, row) => (
          <motion.div key={row}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: row * 0.12 }}
            className="flex items-center gap-2"
          >
            <div className="flex gap-1.5 px-2 py-1.5 rounded-xl"
              style={{
                background: highlightGroup ? `${COLORS[row % COLORS.length]}18` : 'transparent',
                border: highlightGroup ? `1.5px solid ${COLORS[row % COLORS.length]}44` : 'none',
              }}>
              {Array.from({ length: cols }).map((_, col) => (
                <motion.div key={col}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: row * 0.12 + col * 0.05, type: 'spring', stiffness: 400 }}
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: COLORS[row % COLORS.length],
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-black" style={{ color: COLORS[row % COLORS.length] }}>
              group {row + 1}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: rows * 0.12 + 0.2 }}
        className="text-xs font-black px-3 py-1.5 rounded-xl"
        style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
        {rows} groups × {cols} each = <span style={{ color: '#34d399' }}>{rows * cols}</span>
      </motion.div>
    </div>
  )
}

// ── FRACTION BAR ──────────────────────────────────────────────────────────────
// Visual fraction model: shaded bar divided into equal parts
function FractionBar({ total = 4, filled = 1, color = '#f43f5e', showLabel = true }) {
  return (
    <div className="flex flex-col items-center gap-2 w-full" style={{ maxWidth: 280 }}>
      {/* Bar */}
      <div className="flex w-full rounded-xl overflow-hidden"
        style={{ height: 48, border: '2px solid rgba(255,255,255,0.18)' }}>
        {Array.from({ length: total }).map((_, i) => (
          <motion.div key={i}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.09 }}
            style={{
              flex: 1,
              background: i < filled
                ? `linear-gradient(135deg, ${color}cc, ${color})`
                : 'rgba(255,255,255,0.05)',
              borderRight: i < total - 1 ? '2px solid rgba(255,255,255,0.12)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {i < filled && (
              <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.8)' }}>✓</span>
            )}
          </motion.div>
        ))}
      </div>
      {/* Part labels */}
      <div className="flex w-full justify-around text-xs font-black" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{ color: i < filled ? color : undefined }}>1/{total}</span>
        ))}
      </div>
      {showLabel && (
        <div className="text-sm font-black" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <span style={{ color, fontSize: 18 }}>{filled}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>out of</span>
          <span style={{ fontSize: 18 }}>{total}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>= {filled}/{total}</span>
        </div>
      )}
    </div>
  )
}

// ── PLACE VALUE BLOCKS ────────────────────────────────────────────────────────
// Base-ten block representation: hundreds (grids), tens (rods), ones (squares)
function PlaceValueBlocks({ hundreds = 0, tens = 0, ones = 0 }) {
  return (
    <div className="flex items-end gap-5 justify-center py-1 flex-wrap">

      {/* Hundreds — large gridded squares */}
      {hundreds > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5 flex-wrap justify-center" style={{ maxWidth: 100 }}>
            {Array.from({ length: hundreds }).map((_, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                style={{
                  width: 40, height: 40,
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  border: '2px solid #d97706', borderRadius: 6,
                  display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1.5, padding: 3,
                }}>
                {Array.from({ length: 25 }).map((_, j) => (
                  <div key={j} style={{ background: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
                ))}
              </motion.div>
            ))}
          </div>
          <span className="text-xs font-black" style={{ color: '#fbbf24' }}>
            {hundreds === 1 ? '1 hundred' : `${hundreds} hundreds`}
          </span>
        </div>
      )}

      {/* Tens — vertical rods, each with exactly 10 unit squares */}
      {tens > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5 flex-wrap justify-center" style={{ maxWidth: 120 }}>
            {Array.from({ length: tens }).map((_, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (hundreds > 0 ? 0.3 : 0) + i * 0.08 }}
                style={{
                  width: 16,
                  border: '2px solid #059669', borderRadius: 4, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <div key={j} style={{
                    width: '100%', height: 14,
                    background: j % 2 === 0 ? '#34d399' : '#10b981',
                    borderBottom: j < 9 ? '1px solid #059669' : 'none',
                  }} />
                ))}
              </motion.div>
            ))}
          </div>
          <span className="text-xs font-black" style={{ color: '#34d399' }}>
            {tens === 1 ? '1 ten' : `${tens} tens`}
          </span>
        </div>
      )}

      {/* Ones — small squares */}
      {ones > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-1 flex-wrap justify-center" style={{ maxWidth: 90 }}>
            {Array.from({ length: ones }).map((_, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: (hundreds > 0 ? 0.5 : 0) + (tens > 0 ? 0.3 : 0) + i * 0.06,
                  type: 'spring', stiffness: 420,
                }}
                style={{
                  width: 20, height: 20,
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  border: '2px solid #2563eb', borderRadius: 4,
                }}
              />
            ))}
          </div>
          <span className="text-xs font-black" style={{ color: '#60a5fa' }}>
            {ones === 1 ? '1 one' : `${ones} ones`}
          </span>
        </div>
      )}
    </div>
  )
}

// ── PATTERN SEQUENCE ──────────────────────────────────────────────────────────
// Beast Academy style: visual number patterns with pulsing unknown
function PatternSeq({ sequence = [], rule }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {sequence.map((val, i) => {
          const isUnknown = val === null || val === '?'
          return (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}>→</span>
              )}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                  animate={isUnknown ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 0 10px rgba(244,114,182,0.4)',
                      '0 0 22px rgba(244,114,182,0.75)',
                      '0 0 10px rgba(244,114,182,0.4)',
                    ],
                  } : {}}
                  transition={isUnknown ? { duration: 1.5, repeat: Infinity } : {}}
                  style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: isUnknown
                      ? 'linear-gradient(135deg, #4c1d95, #6d28d9)'
                      : `linear-gradient(135deg, ${COLORS[i % COLORS.length]}99, ${COLORS[i % COLORS.length]})`,
                    border: `2.5px solid ${isUnknown ? '#f472b6' : COLORS[i % COLORS.length]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  <span style={{
                    fontWeight: 900,
                    fontSize: isUnknown ? 22 : (String(val).length > 2 ? 13 : 17),
                    color: isUnknown ? '#f472b6' : 'white',
                  }}>
                    {isUnknown ? '?' : val}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          )
        })}
      </div>
      {rule && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: sequence.length * 0.1 + 0.2 }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
          Pattern: {rule}
        </motion.div>
      )}
    </div>
  )
}

// ── NUMBER LINE ───────────────────────────────────────────────────────────────
// Shows addition/subtraction as hops on a number line (RSM counting-on strategy)
function NumberLine({ min = 0, max = 20, hops = [] }) {
  const W = 272, H = 88, PAD = 22
  const toX = (n) => PAD + ((n - min) / (max - min)) * (W - PAD * 2)
  const Y = 60
  const step = max - min <= 20 ? 1 : 5
  const labels = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {/* Arrow line */}
      <line x1={PAD - 4} y1={Y} x2={W - PAD + 4} y2={Y} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <polygon points={`${W - PAD + 4},${Y - 4} ${W - PAD + 10},${Y} ${W - PAD + 4},${Y + 4}`}
        fill="rgba(255,255,255,0.3)" />

      {/* Ticks and labels */}
      {labels.map(n => {
        const x = toX(n)
        return (
          <g key={n}>
            <line x1={x} y1={Y - 5} x2={x} y2={Y + 5} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            <text x={x} y={Y + 17} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9" fontWeight="700">{n}</text>
          </g>
        )
      })}

      {/* Hops — animated parabolic arcs */}
      {hops.map((hop, hi) => {
        const x1 = toX(hop.from)
        const x2 = toX(hop.to)
        const mx = (x1 + x2) / 2
        const r = Math.abs(x2 - x1) / 2
        const arcHeight = Math.min(r * 0.75, 36)
        const d = `M ${x1} ${Y} Q ${mx} ${Y - arcHeight} ${x2} ${Y}`
        const clr = hop.color || COLORS[hi % COLORS.length]
        return (
          <g key={hi}>
            <motion.path d={d} fill="none" stroke={clr} strokeWidth="2.5" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: hi * 0.35, duration: 0.45 }} />
            {/* Hop label */}
            <motion.text x={mx} y={Y - arcHeight - 4} textAnchor="middle"
              fill={clr} fontSize="9" fontWeight="900"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: hi * 0.35 + 0.4 }}>
              {hop.to > hop.from ? `+${hop.to - hop.from}` : `−${hop.from - hop.to}`}
            </motion.text>
          </g>
        )
      })}

      {/* Start dot */}
      {hops.length > 0 && (
        <circle cx={toX(hops[0].from)} cy={Y} r="5" fill={hops[0].color || COLORS[0]} />
      )}
      {/* End dot */}
      {hops.length > 0 && (
        <motion.circle cx={toX(hops[hops.length - 1].to)} cy={Y} r="5" fill="#34d399"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: hops.length * 0.35 + 0.2, type: 'spring' }} />
      )}
    </svg>
  )
}

// ── COMPARISON BARS (bar model) ───────────────────────────────────────────────
// RSM bar model for comparing quantities or showing parts of a whole
export function BarModel({ bars = [] }) {
  const maxVal = Math.max(...bars.map(b => b.value || 0), 1)
  return (
    <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 280 }}>
      {bars.map((bar, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs font-black w-12 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {bar.label}
          </span>
          <div style={{ flex: 1, height: 30, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${(bar.value / maxVal) * 100}%` }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: bar.unknown
                  ? 'linear-gradient(90deg, #4c1d95, #7c3aed)'
                  : `linear-gradient(90deg, ${COLORS[i % COLORS.length]}99, ${COLORS[i % COLORS.length]})`,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', paddingLeft: 8,
                border: bar.unknown ? '2px solid #f472b6' : 'none',
              }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: bar.unknown ? '#f472b6' : 'white' }}>
                {bar.unknown ? '?' : bar.value}
              </span>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── MASTER DISPATCHER ─────────────────────────────────────────────────────────
export default function VisualAid({ visual, phase }) {
  if (!visual?.type) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex justify-center py-2"
    >
      {visual.type === 'tenframe'   && <TenFrame      {...visual} phase={phase} />}
      {visual.type === 'numberbond' && <NumberBond    {...visual} phase={phase} />}
      {visual.type === 'balance'    && <BalanceScale  {...visual} phase={phase} />}
      {visual.type === 'array'      && <ArrayGrid     {...visual} phase={phase} />}
      {visual.type === 'fracbar'    && <FractionBar   {...visual} phase={phase} />}
      {visual.type === 'pvblocks'   && <PlaceValueBlocks {...visual} phase={phase} />}
      {visual.type === 'pattern'    && <PatternSeq    {...visual} phase={phase} />}
      {visual.type === 'numberline' && <NumberLine    {...visual} phase={phase} />}
    </motion.div>
  )
}
