import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PitStop from './PitStop.jsx'
import { initMastery, generateQuestion, generateBossQuestion, SKILLS, SKILL_ORDER } from '../engine/curriculum.js'
import { updateMastery, applySkipLogic, selectSkill, masteryDelta } from '../engine/mastery.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const RACE_LENGTH      = 1.0
const BASE_SPEED       = 0.00035
const AI_BASE_SPEEDS   = [0.00032, 0.00036, 0.00039]
const BOSS_SPEED       = 0.000295         // slightly slower so player can overtake
const BOOST_AMOUNT     = 0.0028
const DOUBLE_BOOST     = 0.0052
const MEGA_BOOST       = 0.008            // pit stop reward
const SKIP_BOOST       = 0.0065          // boss overtake + fast correct
const BOOST_DECAY      = 0.935
const FISHTAIL_FRAMES  = 85
const FAST_MS          = 3000
const MAX_VISIBLE      = 0.15
const BOSS_SPAWNS      = [0.28, 0.62]    // track progress where boss appears
const MISS_STREAK_CAP  = 2               // consecutive misses before pit stop

const AI_COLORS    = ['#ef4444', '#22c55e', '#f59e0b']
const PLAYER_COLOR = '#60a5fa'
const BOSS_COLOR   = '#ffd700'

// ── Road & car rendering (unchanged from Phase 2) ──────────────────────────────
function renderRoad(ctx, W, H, scroll) {
  const HZ = H * 0.40, CX = W / 2
  const RW_TOP = W * 0.06, RW_BOT = W * 0.46

  const sky = ctx.createLinearGradient(0, 0, 0, HZ)
  sky.addColorStop(0, '#060318'); sky.addColorStop(1, '#1a0850')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ)

  ctx.fillStyle = '#fff'
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.3 + (i % 4) * 0.15
    ctx.fillRect((i * 137 + 11) % W, (i * 73 + 7) % (HZ - 8), 1.5, 1.5)
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = '#0c0328'; ctx.beginPath(); ctx.moveTo(0, HZ)
  for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, HZ - 14 - Math.sin(x * 0.03 + scroll * 0.15) * 9)
  ctx.lineTo(W, HZ); ctx.fill()

  for (let i = 0; i < 7; i++) {
    const t1 = ((i / 7 + scroll * 0.028) % 1), t2 = (((i + 0.48) / 7 + scroll * 0.028) % 1)
    if (t2 < t1) continue
    const y1 = HZ + (H - HZ) * t1, y2 = HZ + (H - HZ) * t2
    const hw1 = RW_TOP + (RW_BOT - RW_TOP) * t1, hw2 = RW_TOP + (RW_BOT - RW_TOP) * t2
    const c = i % 2 === 0 ? '#163a08' : '#1c4a0a'
    ctx.fillStyle = c
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(CX - hw1, y1); ctx.lineTo(CX - hw2, y2); ctx.lineTo(0, y2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(W, y1); ctx.lineTo(CX + hw1, y1); ctx.lineTo(CX + hw2, y2); ctx.lineTo(W, y2); ctx.fill()
  }

  ctx.beginPath()
  ctx.moveTo(CX - RW_TOP, HZ); ctx.lineTo(CX + RW_TOP, HZ)
  ctx.lineTo(CX + RW_BOT, H); ctx.lineTo(CX - RW_BOT, H)
  ctx.fillStyle = '#38383c'; ctx.fill()

  for (let i = 0; i < 10; i++) {
    const t1 = ((i / 10 + scroll * 0.028) % 1), t2 = (((i + 0.42) / 10 + scroll * 0.028) % 1)
    if (t2 < t1) continue
    const y1 = HZ + (H - HZ) * t1, y2 = HZ + (H - HZ) * t2
    const hw1 = RW_TOP + (RW_BOT - RW_TOP) * t1, hw2 = RW_TOP + (RW_BOT - RW_TOP) * t2
    const sw1 = hw1 * 0.13, sw2 = hw2 * 0.13
    ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#e5e5e5'
    ctx.beginPath(); ctx.moveTo(CX - hw1, y1); ctx.lineTo(CX - hw1 + sw1, y1); ctx.lineTo(CX - hw2 + sw2, y2); ctx.lineTo(CX - hw2, y2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(CX + hw1 - sw1, y1); ctx.lineTo(CX + hw1, y1); ctx.lineTo(CX + hw2, y2); ctx.lineTo(CX + hw2 - sw2, y2); ctx.fill()
  }

  for (let i = 0; i < 13; i++) {
    const t = ((i / 13 + scroll * 0.028) % 1), tEnd = (((i + 0.28) / 13 + scroll * 0.028) % 1)
    if (tEnd < t) continue
    const y1 = HZ + (H - HZ) * t, y2 = HZ + (H - HZ) * tEnd
    const hw = RW_TOP + (RW_BOT - RW_TOP) * t, dw = Math.max(1.5, t * 4)
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fillRect(CX - hw / 3 - dw / 2, y1, dw, y2 - y1)
    ctx.fillRect(CX + hw / 3 - dw / 2, y1, dw, y2 - y1)
    ctx.fillStyle = 'rgba(255,220,50,0.5)'
    ctx.fillRect(CX - dw / 2, y1, dw, y2 - y1)
  }
}

function drawCar(ctx, cx, cy, scale, color, wobble = 0, isPlayer = false, isBoss = false) {
  ctx.save()
  ctx.translate(cx, cy); ctx.rotate(wobble); ctx.scale(scale, scale)
  const BW = 30, BH = 50

  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath()
  ctx.ellipse(0, BH * 0.56, BW * 0.52, BH * 0.09, 0, 0, Math.PI * 2); ctx.fill()

  if (isPlayer) { ctx.shadowColor = 'rgba(96,165,250,0.6)'; ctx.shadowBlur = 14 }
  if (isBoss)   { ctx.shadowColor = 'rgba(255,215,0,0.9)';  ctx.shadowBlur = 20 }

  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-BW/2, -BH/2, BW, BH, 6); ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = `${color}99`; ctx.beginPath()
  ctx.roundRect(-BW/2+3, -BH/2, BW-6, BH*0.42, [5,5,2,2]); ctx.fill()

  ctx.fillStyle = 'rgba(160,215,255,0.82)'; ctx.beginPath()
  ctx.roundRect(-BW/2+5, -BH/2+4, BW-10, BH*0.26, 3); ctx.fill()

  ctx.fillStyle = '#111'; ctx.beginPath()
  ctx.roundRect(-BW/2+2, BH/2-9, BW-4, 8, [0,0,4,4]); ctx.fill()

  ctx.fillStyle = isBoss ? '#fff' : '#ff3333'
  ctx.beginPath(); ctx.arc(-BW/2+6, BH/2-5, 3.5, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(BW/2-6, BH/2-5, 3.5, 0, Math.PI*2); ctx.fill()

  if (isPlayer) { ctx.fillStyle='#666'; ctx.fillRect(-BW/2+4, BH/2-2, 5, 4); ctx.fillRect(BW/2-9, BH/2-2, 5, 4) }

  for (const [wx, wy] of [[-BW/2-2,-BH*0.2],[BW/2+2,-BH*0.2],[-BW/2-2,BH*0.26],[BW/2+2,BH*0.26]]) {
    ctx.beginPath(); ctx.arc(wx, wy, 7, 0, Math.PI*2); ctx.fillStyle='#1a1a1a'; ctx.fill()
    ctx.beginPath(); ctx.arc(wx, wy, 3.5, 0, Math.PI*2); ctx.fillStyle='#aaa'; ctx.fill()
  }

  // Boss crown
  if (isBoss) {
    ctx.fillStyle = '#ffd700'
    ctx.font = `${Math.round(12/scale)}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText('👑', 0, -BH/2 - 8)
  }

  ctx.restore()
}

function drawFlames(ctx, cx, cy, intensity) {
  if (intensity < 0.05) return
  ctx.save(); ctx.translate(cx, cy + 29)
  for (let j = 0; j < 2; j++) {
    const ox = j === 0 ? -11 : 11, len = intensity * 28 + Math.random() * 7
    const grad = ctx.createLinearGradient(ox, 0, ox, len)
    grad.addColorStop(0, j === 0 ? '#ff5500' : '#ffcc00')
    grad.addColorStop(0.5, '#ff8800'); grad.addColorStop(1, 'rgba(255,150,0,0)')
    ctx.globalAlpha = 0.88; ctx.fillStyle = grad; ctx.beginPath()
    ctx.moveTo(ox-5, 0)
    ctx.bezierCurveTo(ox-5, len*0.4, ox, len*0.8, ox, len)
    ctx.bezierCurveTo(ox, len*0.8, ox+5, len*0.4, ox+5, 0)
    ctx.fill()
  }
  ctx.globalAlpha = 1; ctx.restore()
}

function drawPositionBar(ctx, W, playerProg, aiProgs, bossProgs) {
  const bx = W-90, by=12, bw=80, bh=10
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath()
  ctx.roundRect(bx-4, by-4, bw+8, bh+8, 5); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, 3); ctx.fill()

  const dots = [
    { p: playerProg, c: PLAYER_COLOR },
    ...aiProgs.map((p,i) => ({ p, c: AI_COLORS[i] })),
    ...bossProgs.map(p => ({ p, c: BOSS_COLOR })),
  ]
  for (const { p, c } of dots) {
    const x = bx + Math.min(1, p/RACE_LENGTH) * bw
    ctx.beginPath(); ctx.arc(x, by+bh/2, 4, 0, Math.PI*2)
    ctx.fillStyle = c; ctx.fill()
  }
  ctx.font = '10px system-ui'; ctx.fillText('🏁', bx+bw-2, by+bh+2)
}

// ── NumPad ─────────────────────────────────────────────────────────────────────
const KEYS = ['7','8','9','4','5','6','1','2','3','⌫','0','✓']

function NumPad({ onKey, disabled }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:'100%' }}>
      {KEYS.map(k => (
        <motion.button key={k} whileTap={{ scale:0.9, opacity:0.75 }}
          onPointerDown={e => { e.preventDefault(); !disabled && onKey(k) }}
          style={{
            padding:'14px 0', borderRadius:16, fontWeight:900, fontSize:k==='⌫'||k==='✓'?22:26,
            color:'white', cursor:'pointer', userSelect:'none', touchAction:'none',
            border: k==='✓'?'2px solid #16a34a':k==='⌫'?'2px solid #b91c1c':'2px solid rgba(255,255,255,0.12)',
            background: k==='✓'?'linear-gradient(135deg,#22c55e,#16a34a)':k==='⌫'?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.08)',
            boxShadow: k==='✓'?'0 4px 16px rgba(34,197,94,0.35)':'none',
            opacity: disabled ? 0.4 : 1,
          }}>
          {k}
        </motion.button>
      ))}
    </div>
  )
}

// ── Skill indicator pill ───────────────────────────────────────────────────────
function SkillPill({ skillId, mastery }) {
  if (!skillId || !SKILLS[skillId]) return null
  const skill = SKILLS[skillId]
  const pct   = Math.round((mastery[skillId] ?? 0) * 100)
  return (
    <div style={{
      position:'absolute', top:10, left:12,
      background:'rgba(0,0,0,0.65)', borderRadius:12,
      padding:'4px 10px', fontSize:11, fontWeight:700,
      color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:6,
    }}>
      <span>{skill.label}</span>
      <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:'#22c55e', borderRadius:2, transition:'width 0.4s' }} />
      </div>
      <span style={{ color:'#4ade80' }}>{pct}%</span>
    </div>
  )
}

// ── RaceScreen ─────────────────────────────────────────────────────────────────
export default function RaceScreen({ playerName, gameState, globalMastery: globalMasteryProp = {}, onRaceComplete }) {
  const canvasRef  = useRef(null)
  const rafRef     = useRef(null)
  const lastTsRef  = useRef(0)
  const qStartRef  = useRef(Date.now())
  const inputRef   = useRef('')

  // Mastery tracking (ref so rAF can read latest without closure capture)
  const masteryRef   = useRef(initMastery(globalMasteryProp))
  const masteryInit  = useRef({ ...masteryRef.current })  // snapshot for delta calc at end
  const currentSkill = useRef(selectSkill(masteryRef.current))
  const missStreak   = useRef(0)    // consecutive wrong answers
  const bossOvertaken= useRef({})   // boss index → already triggered?
  const pitStopRef   = useRef(false) // pause physics during pit stop

  // All mutable game state in one ref (no stale closures)
  const G = useRef({
    phase: 'countdown', cdTimer: 0, cdCount: 3,
    scroll: 0,
    player: { prog: 0, boost: 0, fishtail: 0 },
    ais: AI_BASE_SPEEDS.map((s, i) => ({ prog: 0.004 * i, speed: s, lane: i, wobble: 0 })),
    bosses: BOSS_SPAWNS.map((startProg, i) => ({
      prog: startProg, speed: BOSS_SPEED, lane: 0, wobble: 0,
      idx: i, active: false,
    })),
    posUpdateTick: 0,
  })

  // React state (for UI)
  const [question,    setQuestion]    = useState(() => generateQuestion(currentSkill.current))
  const [inputBuf,    setInputBuf]    = useState('')
  const [phase,       setPhase]       = useState('countdown')
  const [feedback,    setFeedback]    = useState(null)
  const [position,    setPosition]    = useState(4)
  const [boostViz,    setBoostViz]    = useState(0)
  const [mastery,     setMastery]     = useState(masteryRef.current)   // for UI only
  const [pitStop,     setPitStop]     = useState(null)   // null | question obj
  const [skillLabel,  setSkillLabel]  = useState(SKILLS[currentSkill.current]?.label)

  // ── Refresh ZPD skill & next question ────────────────────────────────────────
  function nextQuestion(newMastery, isBossContext = false) {
    const skill = isBossContext
      ? selectSkill(newMastery)   // after boss boost, re-evaluate
      : selectSkill(newMastery)
    currentSkill.current = skill
    setSkillLabel(SKILLS[skill]?.label)
    const q = generateQuestion(skill)
    setQuestion(q)
    qStartRef.current = Date.now()
    inputRef.current = ''; setInputBuf('')
    return q
  }

  // ── Answer handler ────────────────────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (G.current.phase !== 'racing' || pitStop) return

    if (key === '⌫') {
      const nxt = inputRef.current.slice(0, -1)
      inputRef.current = nxt; setInputBuf(nxt); return
    }
    if (key === '✓') {
      const ans = parseInt(inputRef.current, 10)
      if (isNaN(ans)) return
      const elapsed = Date.now() - qStartRef.current
      const correct = ans === question.answer
      const p = G.current.player

      // Update mastery
      let m = updateMastery(masteryRef.current, question.skillId, correct, elapsed, FAST_MS)

      if (correct) {
        const isPerfect = elapsed < FAST_MS
        const wasBossQ  = !!question.isBoss

        if (wasBossQ && isPerfect) {
          // Skip-logic: elevate skill, give skip boost
          m = applySkipLogic(m, question.skillId)
          p.boost = SKIP_BOOST
          setFeedback({ type:'perfect', text:'⚡ SKILL UNLOCKED! Skip boost!' })
        } else if (isPerfect) {
          p.boost = DOUBLE_BOOST
          setFeedback({ type:'perfect', text:'⚡ PERFECT SHIFT! ×2 BOOST' })
        } else {
          p.boost = BOOST_AMOUNT
          setFeedback({ type:'correct', text:'🔥 NITRO BOOST!' })
        }
        p.fishtail = 0
        missStreak.current = 0

      } else {
        p.fishtail = FISHTAIL_FRAMES; p.boost = 0
        G.current.ais.forEach(a => { a.speed *= 1.035 })
        missStreak.current++

        if (missStreak.current >= MISS_STREAK_CAP) {
          // Pit stop — regenerate a fresh question for this skill with its visual
          const pitQ = generateQuestion(question.skillId)
          setFeedback(null)
          setPitStop(pitQ)
          pitStopRef.current = true   // pause physics
          missStreak.current = 0
          masteryRef.current = m; setMastery(m)
          inputRef.current = ''; setInputBuf('')
          return
        }
        setFeedback({ type:'wrong', text:'💨 TRACTION LOSS!' })
      }

      masteryRef.current = m; setMastery(m)
      setTimeout(() => setFeedback(null), 1500)
      nextQuestion(m, !!question.isBoss)
      return
    }
    if (/^[0-9]$/.test(key) && inputRef.current.length < 4) {
      const nxt = inputRef.current + key
      inputRef.current = nxt; setInputBuf(nxt)
    }
  }, [question, pitStop])

  // ── Pit stop completion ───────────────────────────────────────────────────────
  const handlePitStopComplete = useCallback((success) => {
    setPitStop(null)
    pitStopRef.current = false  // resume physics
    if (success) {
      G.current.player.boost = MEGA_BOOST
      G.current.player.fishtail = 0
      // Also give mastery credit for the visual scaffold
      const m = updateMastery(masteryRef.current, currentSkill.current, true, 5000)
      masteryRef.current = m; setMastery(m)
      setFeedback({ type:'perfect', text:'🔧 MEGA BOOST! Back in the race!' })
      setTimeout(() => setFeedback(null), 1800)
    }
    nextQuestion(masteryRef.current)
  }, [])

  // ── Game loop ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const r = canvas.getBoundingClientRect()
      canvas.width  = Math.round(r.width  * dpr)
      canvas.height = Math.round(r.height * dpr)
      ctx.scale(dpr, dpr)
    }
    resize()

    function loop(ts) {
      const dt = Math.min(ts - lastTsRef.current, 50)
      lastTsRef.current = ts
      const frames = dt / (1000 / 60)
      const g = G.current, p = g.player
      const W = canvas.getBoundingClientRect().width
      const H = canvas.getBoundingClientRect().height

      if (g.phase === 'countdown') {
        g.cdTimer += dt
        if (g.cdTimer >= 1000) {
          g.cdTimer = 0; g.cdCount--
          if (g.cdCount <= 0) { g.phase = 'racing'; qStartRef.current = Date.now(); setPhase('racing') }
          else setCdDisplay(g.cdCount)
        }

      } else if (g.phase === 'racing' && !pitStopRef.current) {
        // Advance player
        if (p.fishtail > 0) p.fishtail = Math.max(0, p.fishtail - frames)
        if (p.boost > 0)    p.boost    = Math.max(0, p.boost * Math.pow(BOOST_DECAY, frames))
        const speed = BASE_SPEED * (p.fishtail > 0 ? 0.38 : 1.0) + p.boost
        p.prog  += speed * frames
        g.scroll += speed * frames * 18

        // Advance AIs
        g.ais.forEach((a, i) => {
          a.prog  += a.speed * frames
          if (a.prog > p.prog + MAX_VISIBLE * 1.8) a.speed *= 0.997
          if (a.prog < p.prog - 0.08) a.speed = Math.min(AI_BASE_SPEEDS[i] * 1.1, a.speed * 1.001)
          a.wobble = Math.sin(ts * 0.0018 + i * 1.9) * 0.025
        })

        // Advance boss cars + detect overtake
        g.bosses.forEach((boss, bi) => {
          if (boss.prog > p.prog + MAX_VISIBLE * 2) return  // too far ahead, skip
          const wasAhead = boss.prog > p.prog
          boss.prog += boss.speed * frames
          boss.wobble = Math.sin(ts * 0.001 + bi * 3.1) * 0.03

          // Overtake detection
          if (wasAhead && p.prog >= boss.prog && !bossOvertaken.current[bi]) {
            bossOvertaken.current[bi] = true
            // Serve a boss question (grade+ skip-logic)
            const bossQ = generateBossQuestion(currentSkill.current)
            setQuestion(bossQ)
            qStartRef.current = Date.now()
            inputRef.current = ''; setInputBuf('')
            setFeedback({ type:'boss', text:'👑 BOSS CAR! Answer fast for SKILL SKIP!' })
            setTimeout(() => setFeedback(null), 2500)
          }
        })

        // Race end
        if (p.prog >= RACE_LENGTH) {
          g.phase = 'finished'
          setPhase('finished')
          const sorted = [
            { name:'player', p:p.prog },
            ...g.ais.map((a,i) => ({ name:`ai${i}`, p:a.prog })),
          ].sort((a,b) => b.p - a.p)
          const pos = sorted.findIndex(x => x.name === 'player') + 1
          const delta = masteryDelta(masteryInit.current, masteryRef.current)
          onRaceComplete?.({ position: pos, coinsEarned: Math.max(0, 4 - pos) * 15, updatedMastery: delta })
        }

        // React state update throttle
        g.posUpdateTick += dt
        if (g.posUpdateTick > 120) {
          g.posUpdateTick = 0
          const sorted = [
            { name:'player', p:p.prog },
            ...g.ais.map((a,i) => ({ name:`ai${i}`, p:a.prog })),
          ].sort((a,b) => b.p - a.p)
          setPosition(sorted.findIndex(x => x.name === 'player') + 1)
          setBoostViz(p.boost / DOUBLE_BOOST)
        }
      }

      // ── Render ──────────────────────────────────────────────────────────────
      renderRoad(ctx, W, H, g.scroll)
      const HZ = H*0.40, CX = W/2, RW_TOP = W*0.06, RW_BOT = W*0.46

      // Regular AIs ahead
      const allCarsAhead = [
        ...g.ais.map((a,i) => ({ ...a, color:AI_COLORS[i], isBoss:false })),
        ...g.bosses.map(b => ({ ...b, color:BOSS_COLOR, isBoss:true })),
      ].filter(a => a.prog > p.prog).sort((a,b) => b.prog - a.prog)

      for (const a of allCarsAhead) {
        const t = Math.min(1, (a.prog - p.prog) / MAX_VISIBLE)
        if (t >= 0.97) continue
        const screenY = HZ + (H - HZ) * (1 - t)
        const hw = RW_TOP + (RW_BOT - RW_TOP) * (1 - t)
        const laneX = CX + (a.lane - 1) * hw * 0.55
        drawCar(ctx, laneX, screenY, 0.16 + 0.84*(1-t), a.color, a.wobble, false, a.isBoss)
      }

      const playerY = HZ + (H - HZ) * 0.88
      const wobble  = p.fishtail > 0 ? Math.sin(ts*0.045)*0.18*(p.fishtail/FISHTAIL_FRAMES) : 0
      if (p.boost / DOUBLE_BOOST > 0.05) drawFlames(ctx, CX, playerY, p.boost / DOUBLE_BOOST)
      drawCar(ctx, CX, playerY, 1.0, PLAYER_COLOR, wobble, true)

      if (g.phase !== 'countdown') {
        drawPositionBar(ctx, W, p.prog, g.ais.map(a=>a.prog), g.bosses.map(b=>b.prog))
      }

      if (g.phase === 'countdown') {
        ctx.fillStyle = 'rgba(0,0,0,0.52)'; ctx.fillRect(0, 0, W, H)
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const n = g.cdCount
        ctx.font = `bold ${n > 0 ? 96 : 72}px system-ui`
        ctx.fillStyle = n===1 ? '#22c55e' : n===2 ? '#fbbf24' : '#ef4444'
        ctx.fillText(n > 0 ? String(n) : 'GO!', W/2, H/2)
        ctx.textBaseline = 'alphabetic'
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [cdDisplay, setCdDisplay] = useState(3)
  const posBadge = position===1?'🥇 1st':position===2?'🥈 2nd':position===3?'🥉 3rd':'4th'

  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100%', height:'100dvh', overflow:'hidden', background:'#060318' }}>

      {/* Race canvas */}
      <div style={{ position:'relative', flexShrink:0, height:'50vh' }}>
        <canvas ref={canvasRef}
          style={{ width:'100%', height:'100%', display:'block', touchAction:'none' }}
        />

        {/* Skill label + mastery bar */}
        <SkillPill skillId={currentSkill.current} mastery={mastery} />

        {/* Position badge (bottom-left of canvas) */}
        {phase === 'racing' && (
          <div style={{
            position:'absolute', bottom:10, left:12,
            background:'rgba(0,0,0,0.65)', borderRadius:12, padding:'5px 11px',
            fontSize:13, fontWeight:900, color: position===1?'#fbbf24':'white',
          }}>
            {posBadge}
          </div>
        )}

        {/* Boost glow */}
        <AnimatePresence>
          {boostViz > 0.12 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity: boostViz*0.45 }} exit={{ opacity:0 }}
              style={{ position:'absolute', inset:0, pointerEvents:'none',
                background:'linear-gradient(to top,rgba(255,120,0,0.35),transparent 55%)' }} />
          )}
        </AnimatePresence>

        {/* Finished overlay */}
        {phase === 'finished' && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.72)' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:54 }}>🏁</div>
              <div style={{ fontSize:28, fontWeight:900, color:'white', marginTop:4 }}>RACE COMPLETE!</div>
              <div style={{ fontSize:20, fontWeight:900, marginTop:4, color: position===1?'#fbbf24':'#94a3b8' }}>
                {position===1?'🥇 1st Place!':posBadge+' Place'}
              </div>
              <motion.button whileTap={{ scale:0.95 }}
                onPointerDown={() => {
                  const delta = masteryDelta(masteryInit.current, masteryRef.current)
                  onRaceComplete?.({ position, coinsEarned: 0, updatedMastery: delta, replay: true })
                }}
                style={{ marginTop:16, padding:'10px 28px', borderRadius:14, background:'#3b82f6', color:'white', fontWeight:900, fontSize:15, border:'none', cursor:'pointer' }}>
                BACK TO GARAGE
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Math panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, padding:'8px 12px 10px', background:'#0d0922', overflow:'hidden' }}>

        {/* Feedback strip */}
        <div style={{ height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div key={feedback.text}
                initial={{ opacity:0, y:-6, scale:0.88 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                style={{
                  padding:'6px 20px', borderRadius:12, fontWeight:900, fontSize:13,
                  color: feedback.type==='perfect'||feedback.type==='boss' ? '#fbbf24' : feedback.type==='correct' ? '#4ade80' : '#fca5a5',
                  background: feedback.type==='perfect'||feedback.type==='boss' ? 'rgba(251,191,36,0.18)' : feedback.type==='correct' ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                  border:`1.5px solid ${feedback.type==='perfect'||feedback.type==='boss'?'#fbbf2444':feedback.type==='correct'?'#22c55e44':'#ef444444'}`,
                }}>
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question card */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background: question.isBoss ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${question.isBoss ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius:18, padding:'10px 16px',
        }}>
          <span style={{ fontSize:26, fontWeight:900, color: question.isBoss ? '#ffd700' : 'white' }}>
            {question.isBoss && '👑 '}{question.prompt} =
          </span>
          <span style={{
            fontSize:26, fontWeight:900, minWidth:64, textAlign:'center',
            padding:'4px 14px', borderRadius:12,
            background:'rgba(255,255,255,0.07)',
            border:'2px solid rgba(96,165,250,0.35)',
            color: inputBuf ? '#60a5fa' : 'rgba(255,255,255,0.28)',
          }}>
            {inputBuf || '?'}
          </span>
        </div>

        {/* NumPad */}
        <NumPad onKey={handleKey} disabled={phase !== 'racing' || !!pitStop} />
      </div>

      {/* Pit Stop overlay */}
      <AnimatePresence>
        {pitStop && <PitStop question={pitStop} onComplete={handlePitStopComplete} />}
      </AnimatePresence>
    </div>
  )
}
