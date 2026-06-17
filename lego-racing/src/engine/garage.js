/**
 * Lego Garage — parts catalog, mastery gates, and race-stat computation.
 * Imported by both Garage.jsx (UI) and RaceScreen.jsx (physics).
 */

// ── Parts catalog ──────────────────────────────────────────────────────────────
export const PARTS = [
  {
    id: 'v8_blocks',
    name: 'V8 Blocks',
    icon: '🔴',
    slot: 'engine',
    tagline: '+8% Top Speed',
    description: 'Raw power — bricks stacked high under the hood.',
    price: 20,
    masteryReq: null,
    // stat deltas (added to base multiplier of 1.0)
    stats: { speedMult: +0.08 },
  },
  {
    id: 'slick_tires',
    name: 'Slick Tires',
    icon: '⚫',
    slot: 'tires',
    tagline: '−30% Fishtail',
    description: 'Wide-grip rubber — corner like you own it.',
    price: 30,
    masteryReq: null,
    stats: { fishtailMult: -0.30 },
  },
  {
    id: 'aero_spoiler',
    name: 'Aero Spoiler',
    icon: '🔷',
    slot: 'aero',
    tagline: '+15% Boost Power',
    description: 'Pushes the car down so your nitro hits harder.',
    price: 40,
    masteryReq: { skillId: 'add_2digit', label: '2-Digit Add', minScore: 0.60 },
    stats: { boostMult: +0.15 },
  },
  {
    id: 'carbon_brakes',
    name: 'Carbon Brakes',
    icon: '⚪',
    slot: 'brakes',
    tagline: '−50% Spin-Out Time',
    description: 'Stop on a dime — wrong answers sting less.',
    price: 35,
    masteryReq: { skillId: 'sub_2digit', label: '2-Digit Sub', minScore: 0.60 },
    stats: { fishtailMult: -0.50 },
  },
  {
    id: 'twin_turbo',
    name: 'Twin-Turbo',
    icon: '🟡',
    slot: 'engine',    // replaces v8_blocks in the engine slot
    tagline: '+25% Speed  +20% Boost',
    description: 'Two turbos = unstoppable. Only for math champions.',
    price: 60,
    masteryReq: { skillId: 'mult_intro', label: 'Multiplication', minScore: 0.80 },
    stats: { speedMult: +0.25, boostMult: +0.20 },
  },
]

// ── Default game state (exported so sync.js can use it) ───────────────────────
export function defaultEquippedCar() {
  return { engine: null, tires: null, aero: null, brakes: null }
}

// ── Compute race stats from equipped car ───────────────────────────────────────
/**
 * Returns multipliers applied to the base race constants.
 *  speedMult:    multiplied into BASE_SPEED
 *  boostMult:    multiplied into BOOST_AMOUNT / DOUBLE_BOOST
 *  fishtailMult: multiplied into FISHTAIL_FRAMES (< 1 = shorter spin-out)
 */
export function computeCarStats(equippedCar) {
  const stats = { speedMult: 1.0, boostMult: 1.0, fishtailMult: 1.0 }
  if (!equippedCar) return stats

  for (const part of PARTS) {
    if (equippedCar[part.slot] === part.id) {
      for (const [k, v] of Object.entries(part.stats)) {
        stats[k] = (stats[k] ?? 1.0) + v
      }
    }
  }

  // Clamp fishtailMult to minimum 0.1 (can't reduce to zero)
  stats.fishtailMult = Math.max(0.1, stats.fishtailMult)
  return stats
}

// ── Part purchase / equip helpers ──────────────────────────────────────────────
export function canAfford(coins, part) {
  return coins >= part.price
}

export function masteryUnlocked(globalMastery, part) {
  if (!part.masteryReq) return true
  return (globalMastery[part.masteryReq.skillId] ?? 0) >= part.masteryReq.minScore
}

export function isOwned(ownedParts, partId) {
  return (ownedParts ?? []).includes(partId)
}

export function isEquipped(equippedCar, part) {
  return equippedCar?.[part.slot] === part.id
}
