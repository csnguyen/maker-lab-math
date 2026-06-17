import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PitStop from './PitStop.jsx'
import { initMastery, generateQuestion, generateBossQuestion, SKILLS, SKILL_ORDER } from '../engine/curriculum.js'
import { updateMastery, applySkipLogic, selectSkill, masteryDelta } from '../engine/mastery.js'
import { computeCarStats } from '../engine/garage.js'

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

// ── LEGO Racers visual rendering ───────────────────────────────────────────────
function drawPalmTree(ctx, x, y, scale) {
  // Trunk: brown LEGO-brick column
  ctx.fillStyle = '#92400E'
  ctx.fillRect(x - 2.5 * scale, y - 22 * scale, 5 * scale, 22 * scale)
  // Trunk highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(x - 1 * scale, y - 22 * scale, 1.5 * scale, 22 * scale)
  // Leaves — 3 triangular fronds
  const frondColors = ['#16A34A', '#22C55E', '#15803D']
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
    ctx.fillStyle = frondColors[i]
    ctx.beginPath()
    ctx.moveTo(x, y - 22 * scale)
    ctx.lineTo(x + Math.cos(angle) * 15 * scale, y - 22 * scale + Math.sin(angle) * 10 * scale)
    ctx.lineTo(x + Math.cos(angle + 0.5) * 9 * scale, y - 22 * scale + Math.sin(angle + 0.5) * 7 * scale)
    ctx.closePath(); ctx.fill()
  }
  // Coconut
  ctx.fillStyle = '#78350F'
  ctx.beginPath(); ctx.arc(x, y - 23 * scale, 2.5 * scale, 0, Math.PI * 2); ctx.fill()
}

function drawLegoFlag(ctx, x, y, scale, color) {
  // Pole
  ctx.strokeStyle = '#6B7280'; ctx.lineWidth = 1.5 * scale
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 20 * scale); ctx.stroke()
  // Flag
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - 20 * scale)
  ctx.lineTo(x + 10 * scale, y - 17 * scale)
  ctx.lineTo(x, y - 14 * scale)
  ctx.fill()
}

function renderRoad(ctx, W, H, scroll) {
  const HZ = H * 0.42, CX = W / 2
  const RW_TOP = W * 0.07, RW_BOT = W * 0.48

  // ── Bright blue sky ──────────────────────────────────────────────────────
  const sky = ctx.createLinearGradient(0, 0, 0, HZ)
  sky.addColorStop(0, '#1D4ED8'); sky.addColorStop(1, '#7DD3FC')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ)

  // ── Clouds ───────────────────────────────────────────────────────────────
  const cloudDefs = [
    { bx: 0.12, by: 0.15, r: 20, drift: 0.6 },
    { bx: 0.48, by: 0.08, r: 17, drift: 1.0 },
    { bx: 0.75, by: 0.22, r: 14, drift: 0.8 },
    { bx: 0.30, by: 0.30, r: 11, drift: 1.2 },
  ]
  for (const c of cloudDefs) {
    const cx = ((c.bx * W + scroll * c.drift * 3) % (W + 100)) - 50
    const cy = c.by * HZ
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.beginPath(); ctx.ellipse(cx, cy, c.r * 1.5, c.r * 0.75, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx + c.r, cy + 3, c.r * 0.9, c.r * 0.65, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx - c.r * 0.9, cy + 4, c.r * 0.8, c.r * 0.58, 0, 0, Math.PI * 2); ctx.fill()
  }

  // ── Rolling hills on horizon ─────────────────────────────────────────────
  ctx.fillStyle = '#15803D'
  ctx.beginPath(); ctx.moveTo(0, HZ)
  for (let x = 0; x <= W + 10; x += 20)
    ctx.lineTo(x, HZ - 18 - Math.sin(x * 0.022 + scroll * 0.06) * 14)
  ctx.lineTo(W, HZ); ctx.fill()
  // Second layer lighter
  ctx.fillStyle = '#16A34A'
  ctx.beginPath(); ctx.moveTo(0, HZ)
  for (let x = 0; x <= W + 10; x += 20)
    ctx.lineTo(x, HZ - 8 - Math.sin(x * 0.035 + scroll * 0.09 + 1.2) * 8)
  ctx.lineTo(W, HZ); ctx.fill()

  // ── Grass verge (checkerboard LEGO pattern) ───────────────────────────────
  for (let i = 0; i < 9; i++) {
    const t1 = (i / 9), t2 = ((i + 0.52) / 9)
    const y1 = HZ + (H - HZ) * t1, y2 = HZ + (H - HZ) * t2
    const hw1 = RW_TOP + (RW_BOT - RW_TOP) * t1
    const hw2 = RW_TOP + (RW_BOT - RW_TOP) * t2
    const c = i % 2 === 0 ? '#22C55E' : '#16A34A'
    ctx.fillStyle = c
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(CX - hw1, y1); ctx.lineTo(CX - hw2, y2); ctx.lineTo(0, y2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(W, y1); ctx.lineTo(CX + hw1, y1); ctx.lineTo(CX + hw2, y2); ctx.lineTo(W, y2); ctx.fill()
  }

  // ── Road surface ──────────────────────────────────────────────────────────
  ctx.beginPath()
  ctx.moveTo(CX - RW_TOP, HZ); ctx.lineTo(CX + RW_TOP, HZ)
  ctx.lineTo(CX + RW_BOT, H);  ctx.lineTo(CX - RW_BOT, H)
  ctx.fillStyle = '#6B7280'; ctx.fill()
  // Subtle edge shadow
  const roadShade = ctx.createLinearGradient(CX - RW_BOT, 0, CX + RW_BOT, 0)
  roadShade.addColorStop(0, 'rgba(0,0,0,0.22)'); roadShade.addColorStop(0.12, 'rgba(0,0,0,0)')
  roadShade.addColorStop(0.88, 'rgba(0,0,0,0)'); roadShade.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.beginPath()
  ctx.moveTo(CX - RW_TOP, HZ); ctx.lineTo(CX + RW_TOP, HZ)
  ctx.lineTo(CX + RW_BOT, H);  ctx.lineTo(CX - RW_BOT, H)
  ctx.fillStyle = roadShade; ctx.fill()

  // ── Roadside palm trees ───────────────────────────────────────────────────
  const palmBases = [0.08, 0.28, 0.52, 0.72, 0.88]
  for (const base of palmBases) {
    const t = ((base + scroll * 0.020) % 1)
    if (t > 0.94 || t < 0.02) continue
    const py = HZ + (H - HZ) * t
    const hw = RW_TOP + (RW_BOT - RW_TOP) * t
    const sc = 0.18 + 0.82 * t
    drawPalmTree(ctx, CX - hw - 18 * sc, py, sc)
    drawPalmTree(ctx, CX + hw + 18 * sc, py, sc)
  }

  // ── LEGO brick walls on road edges ────────────────────────────────────────
  const brickPalette = ['#EF4444','#FBBF24','#3B82F6','#22C55E','#EF4444','#FBBF24','#A855F7']
  for (let i = 0; i < 10; i++) {
    const t = ((i / 10 + scroll * 0.028) % 1)
    const tNext = (((i + 1) / 10 + scroll * 0.028) % 1)
    if (tNext < t || t > 0.96) continue
    const y  = HZ + (H - HZ) * t
    const hw = RW_TOP + (RW_BOT - RW_TOP) * t
    const sc = 0.22 + 0.78 * t
    const bW = 15 * sc, bH = 9 * sc
    const cL = brickPalette[i % brickPalette.length]
    const cR = brickPalette[(i + 3) % brickPalette.length]

    for (const [bx, col] of [[CX - hw - bW * 0.6, cL], [CX + hw + bW * 0.6, cR]]) {
      // Brick face
      ctx.fillStyle = col
      ctx.beginPath(); ctx.roundRect(bx - bW/2, y - bH/2, bW, bH, 1.5); ctx.fill()
      // Top sheen
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath(); ctx.roundRect(bx - bW/2, y - bH/2, bW, bH * 0.38, [1.5,1.5,0,0]); ctx.fill()
      // Dark outline
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.roundRect(bx - bW/2, y - bH/2, bW, bH, 1.5); ctx.stroke()
      // LEGO stud (2 per brick)
      for (const sx of [bx - bW * 0.22, bx + bW * 0.22]) {
        ctx.fillStyle = col
        ctx.beginPath(); ctx.ellipse(sx, y - bH/2 - 1.8 * sc, 2.2 * sc, 1.4 * sc, 0, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6
        ctx.beginPath(); ctx.ellipse(sx, y - bH/2 - 1.8 * sc, 2.2 * sc, 1.4 * sc, 0, 0, Math.PI * 2); ctx.stroke()
      }
    }
  }

  // ── Flags every few segments ──────────────────────────────────────────────
  const flagBases = [0.18, 0.62]
  const flagColors = ['#EF4444', '#3B82F6']
  for (let fi = 0; fi < flagBases.length; fi++) {
    const t = ((flagBases[fi] + scroll * 0.020) % 1)
    if (t > 0.94 || t < 0.03) continue
    const fy = HZ + (H - HZ) * t
    const hw = RW_TOP + (RW_BOT - RW_TOP) * t
    const sc = 0.2 + 0.8 * t
    drawLegoFlag(ctx, CX - hw - 6 * sc, fy, sc, flagColors[fi % 2])
    drawLegoFlag(ctx, CX + hw + 6 * sc, fy, sc, flagColors[(fi + 1) % 2])
  }

  // ── Curb stripes (red/white) ──────────────────────────────────────────────
  for (let i = 0; i < 12; i++) {
    const t1 = ((i / 12 + scroll * 0.028) % 1), t2 = (((i + 0.44) / 12 + scroll * 0.028) % 1)
    if (t2 < t1) continue
    const y1 = HZ + (H - HZ) * t1, y2 = HZ + (H - HZ) * t2
    const hw1 = RW_TOP + (RW_BOT - RW_TOP) * t1, hw2 = RW_TOP + (RW_BOT - RW_TOP) * t2
    const sw1 = hw1 * 0.10, sw2 = hw2 * 0.10
    ctx.fillStyle = i % 2 === 0 ? '#EF4444' : '#F5F5F5'
    ctx.beginPath(); ctx.moveTo(CX-hw1,y1); ctx.lineTo(CX-hw1+sw1,y1); ctx.lineTo(CX-hw2+sw2,y2); ctx.lineTo(CX-hw2,y2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(CX+hw1-sw1,y1); ctx.lineTo(CX+hw1,y1); ctx.lineTo(CX+hw2,y2); ctx.lineTo(CX+hw2-sw2,y2); ctx.fill()
  }

  // ── Center dashes ─────────────────────────────────────────────────────────
  for (let i = 0; i < 13; i++) {
    const t = ((i / 13 + scroll * 0.028) % 1), tE = (((i + 0.22) / 13 + scroll * 0.028) % 1)
    if (tE < t) continue
    const y1 = HZ + (H - HZ) * t, y2 = HZ + (H - HZ) * tE
    const dw = Math.max(1.5, t * 4)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillRect(CX - dw / 2, y1, dw, y2 - y1)
  }
}

// Pseudo-3D LEGO car — back view with visible top face, cabin, and side-profile wheels
function drawCar(ctx, cx, cy, scale, color, wobble = 0, isPlayer = false, isBoss = false) {
  ctx.save()
  ctx.translate(cx, cy); ctx.rotate(wobble); ctx.scale(scale, scale)

  // ── Dimensions ──────────────────────────────────────────────────────────
  const BW  = 46   // back face width
  const BH  = 18   // back face height
  const TD  = 12   // body top depth (how much roof we see)
  const TIN = 5    // top face taper inset per side
  const CW  = 30   // cabin width
  const CH  = 16   // cabin back face height
  const CTD = 9    // cabin top depth
  const CTI = 3    // cabin top inset per side
  const WR  = 11   // rear wheel radius

  // Y anchors — back face is centered at origin
  const bf_bot = BH / 2
  const bf_top = -BH / 2
  const body_top = bf_top - TD          // top of body top-face
  const cab_bot  = bf_top - TD          // cabin bottom = body top top
  const cab_top  = cab_bot - CH         // cabin top (back face)
  const roof_top = cab_top - CTD        // top of cabin top-face

  // ── Ground shadow ────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.beginPath()
  ctx.ellipse(0, bf_bot + WR * 0.9 + 4, BW * 0.6 + WR * 0.5, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  if (isPlayer) { ctx.shadowColor = 'rgba(96,165,250,0.85)'; ctx.shadowBlur = 22 }
  if (isBoss)   { ctx.shadowColor = 'rgba(255,215,0,0.95)';  ctx.shadowBlur = 28 }

  // ── Rear wheels (drawn before body so body overlaps inner half) ──────────
  const wy = bf_bot - WR * 0.85
  for (const wx of [-BW / 2 - WR * 0.35, BW / 2 + WR * 0.35]) {
    // Tire (ellipse = side profile view)
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath(); ctx.ellipse(wx, wy, WR * 0.62, WR, 0, 0, Math.PI * 2); ctx.fill()
    // Tread band
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.ellipse(wx, wy, WR * 0.62, WR, 0, 0, Math.PI * 2); ctx.stroke()
    // Rim face
    ctx.fillStyle = '#C8C8CC'
    ctx.beginPath(); ctx.ellipse(wx, wy, WR * 0.37, WR * 0.58, 0, 0, Math.PI * 2); ctx.fill()
    // Rim shadow ring
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.ellipse(wx, wy, WR * 0.37, WR * 0.58, 0, 0, Math.PI * 2); ctx.stroke()
    // 5 lug bolts
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 2
      ctx.fillStyle = '#888'
      ctx.beginPath()
      ctx.arc(wx + Math.cos(ang) * WR * 0.24, wy + Math.sin(ang) * WR * 0.38, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
    // Center hub
    ctx.fillStyle = '#555'
    ctx.beginPath(); ctx.ellipse(wx, wy, WR * 0.1, WR * 0.16, 0, 0, Math.PI * 2); ctx.fill()
  }
  ctx.shadowBlur = 0

  // ── Body top face (lighter — faces the sky) ──────────────────────────────
  ctx.beginPath()
  ctx.moveTo(-BW / 2,       bf_top)
  ctx.lineTo( BW / 2,       bf_top)
  ctx.lineTo( BW / 2 - TIN, body_top)
  ctx.lineTo(-BW / 2 + TIN, body_top)
  ctx.closePath()
  ctx.fillStyle = color; ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill()   // sky-facing = lighter
  // LEGO studs on body top face
  const studY = (bf_top + body_top) / 2
  for (const sx of [-13, -4, 4, 13]) {
    ctx.fillStyle = color
    ctx.beginPath(); ctx.ellipse(sx, studY, 3.8, 2.4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.7; ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.6
    ctx.beginPath(); ctx.ellipse(sx, studY - 0.5, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.stroke()
  }
  // Top edge outline
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-BW/2, bf_top); ctx.lineTo(BW/2, bf_top)
  ctx.lineTo(BW/2-TIN, body_top); ctx.lineTo(-BW/2+TIN, body_top); ctx.closePath()
  ctx.stroke()

  // ── Back face (main body panel) ──────────────────────────────────────────
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(-BW/2, bf_top, BW, BH, [2, 2, 6, 6]); ctx.fill()
  // Panel lines
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.8
  ctx.strokeRect(-BW/2+4, bf_top+2, BW/2-6, BH-4)
  ctx.strokeRect(2, bf_top+2, BW/2-6, BH-4)
  // Body outline
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.roundRect(-BW/2, bf_top, BW, BH, [2, 2, 6, 6]); ctx.stroke()

  // Tail lights (wide LEGO brick style)
  const tlColor = isBoss ? '#fff' : '#EF4444'
  for (const tx of [-BW/2+2, BW/2-13]) {
    ctx.fillStyle = tlColor
    ctx.beginPath(); ctx.roundRect(tx, bf_bot-9, 11, 7, 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillRect(tx+1, bf_bot-9, 3, 3)
    // glow
    ctx.fillStyle = isBoss ? 'rgba(255,255,200,0.3)' : 'rgba(239,68,68,0.35)'
    ctx.beginPath(); ctx.arc(tx+5.5, bf_bot-5.5, 6, 0, Math.PI*2); ctx.fill()
  }

  // Rear bumper
  ctx.fillStyle = '#2D3748'
  ctx.beginPath(); ctx.roundRect(-BW/2+1, bf_bot-5, BW-2, 7, [0, 0, 5, 5]); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(-BW/2+1, bf_bot-5, BW-2, 2)

  // Exhaust pipes
  for (const ex of [-BW/2+11, BW/2-11]) {
    ctx.fillStyle = '#718096'
    ctx.beginPath(); ctx.ellipse(ex, bf_bot+2, 4, 3, 0, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath(); ctx.ellipse(ex, bf_bot+2, 2.2, 1.8, 0, 0, Math.PI*2); ctx.fill()
  }

  // ── Cabin top face (lightest — highest, most sky-facing) ─────────────────
  ctx.beginPath()
  ctx.moveTo(-CW/2,       cab_top)
  ctx.lineTo( CW/2,       cab_top)
  ctx.lineTo( CW/2 - CTI, roof_top)
  ctx.lineTo(-CW/2 + CTI, roof_top)
  ctx.closePath()
  ctx.fillStyle = color; ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.50)'; ctx.fill()   // even lighter on top
  // Roof studs
  const roofStudY = (cab_top + roof_top) / 2
  for (const sx of [-8, 0, 8]) {
    ctx.fillStyle = color
    ctx.beginPath(); ctx.ellipse(sx, roofStudY, 3.2, 2.0, 0, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath(); ctx.ellipse(sx, roofStudY, 3.2, 2.0, 0, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6; ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-CW/2, cab_top); ctx.lineTo(CW/2, cab_top)
  ctx.lineTo(CW/2-CTI, roof_top); ctx.lineTo(-CW/2+CTI, roof_top); ctx.closePath()
  ctx.stroke()

  // ── Cabin back face (slightly darker — vertical face) ────────────────────
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(-CW/2, cab_top, CW, CH, [5, 5, 2, 2]); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.18)'   // darken for shading
  ctx.beginPath(); ctx.roundRect(-CW/2, cab_top, CW, CH, [5, 5, 2, 2]); ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(-CW/2, cab_top, CW, CH, [5, 5, 2, 2]); ctx.stroke()

  // Rear window glass
  ctx.fillStyle = 'rgba(186,230,253,0.80)'
  ctx.beginPath(); ctx.roundRect(-CW/2+5, cab_top+3, CW-10, CH-5, 3); ctx.fill()
  // Reflection
  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.fillRect(-CW/2+7, cab_top+4, 5, (CH-5)*0.45)

  // ── Minifigure driver visible through rear window ─────────────────────────
  const dY = cab_top + CH * 0.52
  // Helmet top
  ctx.fillStyle = isPlayer ? '#1D4ED8' : isBoss ? '#7C3AED' : '#374151'
  ctx.beginPath(); ctx.arc(0, dY, 5.8, Math.PI, 0); ctx.fill()
  // Face (yellow)
  ctx.fillStyle = '#FCD34D'
  ctx.beginPath(); ctx.arc(0, dY, 5.8, 0, Math.PI); ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke()
  // Eyes
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(-2, dY+1, 1, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(2, dY+1, 1, 0, Math.PI*2); ctx.fill()

  // ── Boss crown floats above roof ─────────────────────────────────────────
  if (isBoss) {
    ctx.fillStyle = '#FBBF24'
    ctx.font = `bold ${Math.round(14 / scale)}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText('👑', 0, roof_top - 10)
  }

  ctx.restore()
}

function drawFlames(ctx, cx, cy, intensity) {
  if (intensity < 0.05) return
  ctx.save(); ctx.translate(cx, cy + 26)
  for (let j = 0; j < 3; j++) {
    const ox = (j - 1) * 11, len = intensity * 32 + Math.random() * 8
    const grad = ctx.createLinearGradient(ox, 0, ox, len)
    grad.addColorStop(0, j === 1 ? '#fff' : '#FBBF24')
    grad.addColorStop(0.3, '#F97316')
    grad.addColorStop(0.7, '#EF4444')
    grad.addColorStop(1, 'rgba(239,68,68,0)')
    ctx.globalAlpha = 0.82; ctx.fillStyle = grad; ctx.beginPath()
    ctx.moveTo(ox - 5, 0)
    ctx.bezierCurveTo(ox - 5, len*0.4, ox, len*0.85, ox, len)
    ctx.bezierCurveTo(ox, len*0.85, ox + 5, len*0.4, ox + 5, 0)
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
  // Car upgrade stats — computed once at mount from equipped parts
  const carStats = computeCarStats(gameState?.equipped_car ?? {})
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
          m = applySkipLogic(m, question.skillId)
          p.boost = SKIP_BOOST * carStats.boostMult
          setFeedback({ type:'perfect', text:'⚡ SKILL UNLOCKED! Skip boost!' })
        } else if (isPerfect) {
          p.boost = DOUBLE_BOOST * carStats.boostMult
          setFeedback({ type:'perfect', text:'⚡ PERFECT SHIFT! ×2 BOOST' })
        } else {
          p.boost = BOOST_AMOUNT * carStats.boostMult
          setFeedback({ type:'correct', text:'🔥 NITRO BOOST!' })
        }
        p.fishtail = 0
        missStreak.current = 0

      } else {
        p.fishtail = Math.round(FISHTAIL_FRAMES * carStats.fishtailMult); p.boost = 0
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
        // carStats comes from closure (mounted once, so safe)
        const baseSpd = BASE_SPEED * carStats.speedMult
        const speed = baseSpd * (p.fishtail > 0 ? 0.38 : 1.0) + p.boost * carStats.boostMult
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
