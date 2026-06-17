import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Question generator ─────────────────────────────────────────────────────────
function genQuestion(difficulty = 0) {
  if (difficulty === 0) {
    const a = Math.floor(Math.random() * 9) + 1
    const b = Math.floor(Math.random() * 9) + 1
    if (Math.random() > 0.5) return { prompt: `${a} + ${b}`, answer: a + b }
    const [hi, lo] = a >= b ? [a, b] : [b, a]
    return { prompt: `${hi} − ${lo}`, answer: hi - lo }
  }
  if (difficulty === 1) {
    const a = Math.floor(Math.random() * 30) + 12
    const b = Math.floor(Math.random() * 18) + 5
    if (Math.random() > 0.5) return { prompt: `${a} + ${b}`, answer: a + b }
    return { prompt: `${a} − ${b}`, answer: a - b }
  }
  const a = Math.floor(Math.random() * 8) + 2
  const b = Math.floor(Math.random() * 8) + 2
  return { prompt: `${a} × ${b}`, answer: a * b }
}

// ── Constants ──────────────────────────────────────────────────────────────────
const RACE_LENGTH       = 1.0
const BASE_SPEED        = 0.00035   // progress/frame at 60fps → ~48s race
const AI_BASE_SPEEDS    = [0.00032, 0.00036, 0.00039]
const BOOST_AMOUNT      = 0.0028
const DOUBLE_BOOST      = 0.0052
const BOOST_DECAY       = 0.935     // per frame
const FISHTAIL_FRAMES   = 85
const FAST_MS           = 3000
const MAX_VISIBLE       = 0.15      // fraction of track visible ahead

const AI_COLORS   = ['#ef4444', '#22c55e', '#f59e0b']
const PLAYER_COLOR = '#60a5fa'

// ── Road renderer ──────────────────────────────────────────────────────────────
function renderRoad(ctx, W, H, scroll) {
  const HZ = H * 0.40   // horizon y
  const CX = W / 2
  const RW_TOP = W * 0.06
  const RW_BOT = W * 0.46

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, HZ)
  sky.addColorStop(0, '#060318')
  sky.addColorStop(1, '#1a0850')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, HZ)

  // Stars (deterministic positions)
  ctx.fillStyle = '#fff'
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.3 + (i % 4) * 0.15
    ctx.fillRect((i * 137 + 11) % W, (i * 73 + 7) % (HZ - 8), 1.5, 1.5)
  }
  ctx.globalAlpha = 1

  // Silhouette hills
  ctx.fillStyle = '#0c0328'
  ctx.beginPath()
  ctx.moveTo(0, HZ)
  for (let x = 0; x <= W + 20; x += 20) {
    const h = 14 + Math.sin(x * 0.03 + scroll * 0.15) * 9
    ctx.lineTo(x, HZ - h)
  }
  ctx.lineTo(W, HZ)
  ctx.fill()

  // Alternating grass bands (speed-stripe effect)
  const grassBands = 7
  for (let i = 0; i < grassBands; i++) {
    const t1 = ((i / grassBands + scroll * 0.028) % 1)
    const t2 = (((i + 0.48) / grassBands + scroll * 0.028) % 1)
    if (t2 < t1) continue
    const y1 = HZ + (H - HZ) * t1
    const y2 = HZ + (H - HZ) * t2
    const hw1 = RW_TOP + (RW_BOT - RW_TOP) * t1
    const hw2 = RW_TOP + (RW_BOT - RW_TOP) * t2
    const c = i % 2 === 0 ? '#163a08' : '#1c4a0a'
    ctx.fillStyle = c
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(CX - hw1, y1)
    ctx.lineTo(CX - hw2, y2); ctx.lineTo(0, y2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(W, y1); ctx.lineTo(CX + hw1, y1)
    ctx.lineTo(CX + hw2, y2); ctx.lineTo(W, y2); ctx.fill()
  }

  // Road surface
  ctx.beginPath()
  ctx.moveTo(CX - RW_TOP, HZ); ctx.lineTo(CX + RW_TOP, HZ)
  ctx.lineTo(CX + RW_BOT, H); ctx.lineTo(CX - RW_BOT, H)
  ctx.fillStyle = '#38383c'
  ctx.fill()

  // Rumble strips (edges)
  const nStripes = 10
  for (let i = 0; i < nStripes; i++) {
    const t1 = ((i / nStripes + scroll * 0.028) % 1)
    const t2 = (((i + 0.42) / nStripes + scroll * 0.028) % 1)
    if (t2 < t1) continue
    const y1 = HZ + (H - HZ) * t1, y2 = HZ + (H - HZ) * t2
    const hw1 = RW_TOP + (RW_BOT - RW_TOP) * t1
    const hw2 = RW_TOP + (RW_BOT - RW_TOP) * t2
    const sw1 = hw1 * 0.13, sw2 = hw2 * 0.13
    ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#e5e5e5'
    // Left
    ctx.beginPath(); ctx.moveTo(CX - hw1, y1); ctx.lineTo(CX - hw1 + sw1, y1)
    ctx.lineTo(CX - hw2 + sw2, y2); ctx.lineTo(CX - hw2, y2); ctx.fill()
    // Right
    ctx.beginPath(); ctx.moveTo(CX + hw1 - sw1, y1); ctx.lineTo(CX + hw1, y1)
    ctx.lineTo(CX + hw2, y2); ctx.lineTo(CX + hw2 - sw2, y2); ctx.fill()
  }

  // Lane dividers + center dashes
  const nDash = 13
  for (let i = 0; i < nDash; i++) {
    const t = ((i / nDash + scroll * 0.028) % 1)
    const tEnd = (((i + 0.28) / nDash + scroll * 0.028) % 1)
    if (tEnd < t) continue
    const y1 = HZ + (H - HZ) * t, y2 = HZ + (H - HZ) * tEnd
    const hw = RW_TOP + (RW_BOT - RW_TOP) * t
    const dw = Math.max(1.5, t * 4)
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fillRect(CX - hw / 3 - dw / 2, y1, dw, y2 - y1)
    ctx.fillRect(CX + hw / 3 - dw / 2, y1, dw, y2 - y1)
    ctx.fillStyle = 'rgba(255,220,50,0.5)'
    ctx.fillRect(CX - dw / 2, y1, dw, y2 - y1)
  }
}

// ── Car drawing (seen from behind — rear bumper at bottom) ─────────────────────
function drawCar(ctx, cx, cy, scale, color, wobble = 0, isPlayer = false) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(wobble)
  ctx.scale(scale, scale)

  const BW = 30, BH = 50

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.beginPath()
  ctx.ellipse(0, BH * 0.56, BW * 0.52, BH * 0.09, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body
  if (isPlayer) { ctx.shadowColor = 'rgba(96,165,250,0.6)'; ctx.shadowBlur = 14 }
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(-BW / 2, -BH / 2, BW, BH, 6); ctx.fill()
  ctx.shadowBlur = 0

  // Rear windshield (visible from behind — top of shape)
  ctx.fillStyle = 'rgba(160,215,255,0.82)'
  ctx.beginPath(); ctx.roundRect(-BW / 2 + 5, -BH / 2 + 4, BW - 10, BH * 0.26, 3); ctx.fill()

  // Roof (darker)
  ctx.fillStyle = `${color}99`
  ctx.beginPath(); ctx.roundRect(-BW / 2 + 3, -BH / 2 + BH * 0.28, BW - 6, BH * 0.24, [2, 2, 0, 0]); ctx.fill()

  // Rear bumper (bottom)
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.roundRect(-BW / 2 + 2, BH / 2 - 9, BW - 4, 8, [0, 0, 4, 4]); ctx.fill()

  // Taillights (red, at rear/bottom)
  ctx.fillStyle = '#ff3333'
  ctx.beginPath(); ctx.arc(-BW / 2 + 6, BH / 2 - 5, 3.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(BW / 2 - 6, BH / 2 - 5, 3.5, 0, Math.PI * 2); ctx.fill()

  // Exhaust pipes (on rear bumper for player)
  if (isPlayer) {
    ctx.fillStyle = '#666'
    ctx.fillRect(-BW / 2 + 4, BH / 2 - 2, 5, 4)
    ctx.fillRect(BW / 2 - 9, BH / 2 - 2, 5, 4)
  }

  // Wheels
  for (const [wx, wy] of [[-BW / 2 - 2, -BH * 0.2], [BW / 2 + 2, -BH * 0.2], [-BW / 2 - 2, BH * 0.26], [BW / 2 + 2, BH * 0.26]]) {
    ctx.beginPath(); ctx.arc(wx, wy, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#1a1a1a'; ctx.fill()
    ctx.beginPath(); ctx.arc(wx, wy, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = '#aaa'; ctx.fill()
  }

  ctx.restore()
}

// ── Boost flames (emit from exhaust at rear/bottom of player car) ──────────────
function drawFlames(ctx, cx, cy, intensity) {
  if (intensity < 0.05) return
  ctx.save()
  ctx.translate(cx, cy + 29) // rear of player car (cy is car center, BH/2=25 + bumper offset)
  for (let j = 0; j < 2; j++) {
    const ox = j === 0 ? -11 : 11
    const len = intensity * 28 + Math.random() * 7
    const grad = ctx.createLinearGradient(ox, 0, ox, len)
    grad.addColorStop(0, j === 0 ? '#ff5500' : '#ffcc00')
    grad.addColorStop(0.5, '#ff8800')
    grad.addColorStop(1, 'rgba(255,150,0,0)')
    ctx.globalAlpha = 0.88
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(ox - 5, 0)
    ctx.bezierCurveTo(ox - 5, len * 0.4, ox, len * 0.8, ox, len)
    ctx.bezierCurveTo(ox, len * 0.8, ox + 5, len * 0.4, ox + 5, 0)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

// ── Mini race position bar ─────────────────────────────────────────────────────
function drawPositionBar(ctx, W, playerProg, aiProgs) {
  const bx = W - 90, by = 12, bw = 80, bh = 10
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath(); ctx.roundRect(bx - 4, by - 4, bw + 8, bh + 8, 5); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3); ctx.fill()

  const dots = [
    { p: playerProg, c: PLAYER_COLOR },
    ...aiProgs.map((p, i) => ({ p, c: AI_COLORS[i] })),
  ]
  for (const { p, c } of dots) {
    const x = bx + Math.min(1, p / RACE_LENGTH) * bw
    ctx.beginPath(); ctx.arc(x, by + bh / 2, 4, 0, Math.PI * 2)
    ctx.fillStyle = c; ctx.fill()
  }

  // Checkered flag at end
  ctx.font = '10px system-ui'
  ctx.fillText('🏁', bx + bw - 2, by + bh + 2)
}

// ── NumPad ─────────────────────────────────────────────────────────────────────
const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0', '✓']

function NumPad({ onKey, disabled }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
      {KEYS.map(k => (
        <motion.button
          key={k}
          whileTap={{ scale: 0.9, opacity: 0.75 }}
          onPointerDown={e => { e.preventDefault(); !disabled && onKey(k) }}
          style={{
            padding: '14px 0',
            borderRadius: 16,
            fontWeight: 900,
            fontSize: k === '⌫' || k === '✓' ? 22 : 26,
            color: 'white',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'none',
            border: k === '✓' ? '2px solid #16a34a'
              : k === '⌫' ? '2px solid #b91c1c'
              : '2px solid rgba(255,255,255,0.12)',
            background: k === '✓' ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : k === '⌫' ? 'rgba(239,68,68,0.25)'
              : 'rgba(255,255,255,0.08)',
            boxShadow: k === '✓' ? '0 4px 16px rgba(34,197,94,0.35)' : 'none',
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {k}
        </motion.button>
      ))}
    </div>
  )
}

// ── RaceScreen ─────────────────────────────────────────────────────────────────
export default function RaceScreen({ playerName, gameState, onRaceComplete }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const lastTsRef = useRef(0)
  const qStartRef = useRef(Date.now())
  const inputRef  = useRef('')

  // All mutable game state lives in one ref — zero stale closures
  const G = useRef({
    phase: 'countdown',   // countdown | racing | finished
    cdTimer: 0, cdCount: 3,
    scroll: 0,
    player: { prog: 0, boost: 0, fishtail: 0 },
    ais: AI_BASE_SPEEDS.map((s, i) => ({
      prog: 0.004 * i,   // stagger starts
      speed: s,
      lane: i,
      wobble: 0,
    })),
    difficulty: 0,
    posUpdateTick: 0,
  })

  // React state (only for UI renders)
  const [question,   setQuestion]   = useState(() => genQuestion(0))
  const [inputBuf,   setInputBuf]   = useState('')
  const [phase,      setPhase]      = useState('countdown')
  const [cdDisplay,  setCdDisplay]  = useState(3)
  const [feedback,   setFeedback]   = useState(null)   // { type, text }
  const [position,   setPosition]   = useState(4)      // 1–4
  const [boostViz,   setBoostViz]   = useState(0)      // 0–1

  // ── Answer handler ────────────────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (G.current.phase !== 'racing') return
    if (key === '⌫') {
      const nxt = inputRef.current.slice(0, -1)
      inputRef.current = nxt; setInputBuf(nxt)
      return
    }
    if (key === '✓') {
      const ans = parseInt(inputRef.current, 10)
      if (isNaN(ans)) return
      const elapsed = Date.now() - qStartRef.current
      const p = G.current.player
      const correct = ans === question.answer

      if (correct) {
        const isPerfect = elapsed < FAST_MS
        p.boost = isPerfect ? DOUBLE_BOOST : BOOST_AMOUNT
        p.fishtail = 0
        setFeedback({ type: isPerfect ? 'perfect' : 'correct',
          text: isPerfect ? '⚡ PERFECT SHIFT! ×2 BOOST' : '🔥 NITRO BOOST!' })
      } else {
        p.fishtail = FISHTAIL_FRAMES
        p.boost = 0
        // Give AI a tiny nudge
        G.current.ais.forEach(a => { a.speed *= 1.04 })
        setFeedback({ type: 'wrong', text: '💨 TRACTION LOSS!' })
      }
      setTimeout(() => setFeedback(null), 1600)

      G.current.difficulty = Math.min(2, Math.floor(p.prog / RACE_LENGTH * 3))
      const next = genQuestion(G.current.difficulty)
      setQuestion(next)
      qStartRef.current = Date.now()
      inputRef.current = ''; setInputBuf('')
      return
    }
    if (/^[0-9]$/.test(key) && inputRef.current.length < 4) {
      const nxt = inputRef.current + key
      inputRef.current = nxt; setInputBuf(nxt)
    }
  }, [question])

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Size canvas buffer to actual CSS pixels × DPR
    function resize() {
      const dpr = window.devicePixelRatio || 1
      const r = canvas.getBoundingClientRect()
      canvas.width  = Math.round(r.width  * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.scale(dpr, dpr)
    }
    resize()

    function loop(ts) {
      const raw = ts - lastTsRef.current
      lastTsRef.current = ts
      const dt = Math.min(raw, 50)           // cap at 50ms to survive tab-switch
      const frames = dt / (1000 / 60)        // normalize to 60fps units

      const g   = G.current
      const p   = g.player
      const W   = canvas.getBoundingClientRect().width
      const H   = canvas.getBoundingClientRect().height

      // ── Phase: countdown ────────────────────────────────────────────────
      if (g.phase === 'countdown') {
        g.cdTimer += dt
        if (g.cdTimer >= 1000) {
          g.cdTimer = 0
          g.cdCount--
          if (g.cdCount <= 0) {
            g.phase = 'racing'
            qStartRef.current = Date.now()
            setPhase('racing')
          } else {
            setCdDisplay(g.cdCount)
          }
        }

      // ── Phase: racing ────────────────────────────────────────────────────
      } else if (g.phase === 'racing') {
        // Fishtail
        if (p.fishtail > 0) {
          p.fishtail = Math.max(0, p.fishtail - frames)
        }
        // Boost decay
        if (p.boost > 0) {
          p.boost = Math.max(0, p.boost * Math.pow(BOOST_DECAY, frames))
        }
        const fishtailMult = p.fishtail > 0 ? 0.38 : 1.0
        const effectiveSpeed = BASE_SPEED * fishtailMult + p.boost
        p.prog   += effectiveSpeed * frames
        g.scroll += effectiveSpeed * frames * 18

        // AIs
        g.ais.forEach((a, i) => {
          a.prog  += a.speed * frames
          // Slight rubber-band so they don't vanish off screen
          if (a.prog > p.prog + MAX_VISIBLE * 1.8) a.speed *= 0.997
          if (a.prog < p.prog - 0.08) a.speed = Math.min(AI_BASE_SPEEDS[i] * 1.08, a.speed * 1.001)
          a.wobble = Math.sin(ts * 0.0018 + i * 1.9) * 0.025
        })

        // Race end
        if (p.prog >= RACE_LENGTH) {
          g.phase = 'finished'
          setPhase('finished')
          const sorted = [
            { name: 'player', p: p.prog },
            ...g.ais.map((a, i) => ({ name: `ai${i}`, p: a.prog })),
          ].sort((a, b) => b.p - a.p)
          const pos = sorted.findIndex(x => x.name === 'player') + 1
          onRaceComplete?.({ position: pos, coinsEarned: Math.max(0, 4 - pos) * 15 })
        }

        // Throttle React position + boost state update to ~8fps
        g.posUpdateTick += dt
        if (g.posUpdateTick > 120) {
          g.posUpdateTick = 0
          const sorted = [
            { name: 'player', p: p.prog },
            ...g.ais.map((a, i) => ({ name: `ai${i}`, p: a.prog })),
          ].sort((a, b) => b.p - a.p)
          setPosition(sorted.findIndex(x => x.name === 'player') + 1)
          setBoostViz(p.boost / DOUBLE_BOOST)
        }
      }

      // ── Render ────────────────────────────────────────────────────────────
      renderRoad(ctx, W, H, g.scroll)

      const HZ  = H * 0.40
      const CX  = W / 2
      const RW_TOP = W * 0.06
      const RW_BOT = W * 0.46

      // Cars ahead (draw furthest first so nearer ones overlap)
      const ahead = g.ais
        .map((a, i) => ({ ...a, color: AI_COLORS[i] }))
        .filter(a => a.prog > p.prog)
        .sort((a, b) => b.prog - a.prog)

      for (const a of ahead) {
        const t = Math.min(1, (a.prog - p.prog) / MAX_VISIBLE)
        if (t >= 0.97) continue
        const screenY = HZ + (H - HZ) * (1 - t)
        const hw      = RW_TOP + (RW_BOT - RW_TOP) * (1 - t)
        const laneX   = CX + (a.lane - 1) * hw * 0.55
        const scale   = 0.16 + 0.84 * (1 - t)
        drawCar(ctx, laneX, screenY, scale, a.color, a.wobble)
      }

      // Player car — always at lower quarter of road
      const playerY = HZ + (H - HZ) * 0.88
      const fishtailWobble = p.fishtail > 0
        ? Math.sin(ts * 0.045) * 0.18 * (p.fishtail / FISHTAIL_FRAMES)
        : 0
      const boostNorm = p.boost / DOUBLE_BOOST
      if (boostNorm > 0.05) drawFlames(ctx, CX, playerY, boostNorm)
      drawCar(ctx, CX, playerY, 1.0, PLAYER_COLOR, fishtailWobble, true)

      // Mini position bar
      if (g.phase !== 'countdown') {
        drawPositionBar(ctx, W, p.prog, g.ais.map(a => a.prog))
      }

      // Countdown overlay
      if (g.phase === 'countdown') {
        ctx.fillStyle = 'rgba(0,0,0,0.52)'
        ctx.fillRect(0, 0, W, H)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const count = g.cdCount
        ctx.font = `bold ${count > 0 ? 96 : 72}px system-ui`
        ctx.fillStyle = count === 1 ? '#22c55e' : count === 2 ? '#fbbf24' : '#ef4444'
        ctx.fillText(count > 0 ? String(count) : 'GO!', W / 2, H / 2)
        ctx.textBaseline = 'alphabetic'
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Layout ────────────────────────────────────────────────────────────────
  const posBadge = position === 1 ? '🥇 1st' : position === 2 ? '🥈 2nd' : position === 3 ? '🥉 3rd' : '4th'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100dvh', overflow: 'hidden', background: '#060318' }}>

      {/* ── Race canvas ────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', flexShrink: 0, height: '50vh' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        />

        {/* Position badge */}
        {phase === 'racing' && (
          <div style={{
            position: 'absolute', top: 10, left: 12,
            background: 'rgba(0,0,0,0.65)', borderRadius: 12,
            padding: '5px 11px', fontSize: 13, fontWeight: 900, color: position === 1 ? '#fbbf24' : 'white',
          }}>
            {posBadge}
          </div>
        )}

        {/* Boost glow overlay */}
        <AnimatePresence>
          {boostViz > 0.12 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: boostViz * 0.45 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(to top, rgba(255,120,0,0.35), transparent 55%)' }}
            />
          )}
        </AnimatePresence>

        {/* Finished overlay */}
        {phase === 'finished' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 54 }}>🏁</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginTop: 4 }}>RACE COMPLETE!</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4, color: position === 1 ? '#fbbf24' : '#94a3b8' }}>
                {position === 1 ? '🥇 1st Place!' : `${posBadge} Place`}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onPointerDown={() => onRaceComplete?.({ position, coinsEarned: 0, replay: true })}
                style={{ marginTop: 16, padding: '10px 28px', borderRadius: 14, background: '#3b82f6', color: 'white', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer' }}
              >
                BACK TO GARAGE
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* ── Math panel ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px 10px', background: '#0d0922', overflow: 'hidden' }}>

        {/* Feedback strip */}
        <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                key={feedback.text}
                initial={{ opacity: 0, y: -6, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  padding: '6px 20px', borderRadius: 12, fontWeight: 900, fontSize: 14,
                  color: feedback.type === 'perfect' ? '#fbbf24' : feedback.type === 'correct' ? '#4ade80' : '#fca5a5',
                  background: feedback.type === 'perfect' ? 'rgba(251,191,36,0.18)' : feedback.type === 'correct' ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                  border: `1.5px solid ${feedback.type === 'perfect' ? '#fbbf2444' : feedback.type === 'correct' ? '#22c55e44' : '#ef444444'}`,
                }}>
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question card */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: '10px 16px',
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: 'white' }}>{question.prompt} =</span>
          <span style={{
            fontSize: 26, fontWeight: 900, minWidth: 64, textAlign: 'center',
            padding: '4px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.07)',
            border: '2px solid rgba(96,165,250,0.35)',
            color: inputBuf ? '#60a5fa' : 'rgba(255,255,255,0.28)',
          }}>
            {inputBuf || '?'}
          </span>
        </div>

        {/* NumPad */}
        <NumPad onKey={handleKey} disabled={phase !== 'racing'} />
      </div>
    </div>
  )
}
