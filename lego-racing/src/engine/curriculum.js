/**
 * Lego Racing skill curriculum.
 * Skill IDs match the shared `global_math_mastery` keys in schema.js so that
 * mastery earned in Maker Lab auto-skips drills here, and vice-versa.
 */

// ── Skill tree ─────────────────────────────────────────────────────────────────
export const SKILLS = {
  add_within_10: {
    id: 'add_within_10', label: 'Add ≤10', grade: 1,
    prereqs: [], masteryThreshold: 0.85,
    visualType: 'add_blocks',
  },
  sub_within_10: {
    id: 'sub_within_10', label: 'Sub ≤10', grade: 1,
    prereqs: [], masteryThreshold: 0.85,
    visualType: 'sub_blocks',
  },
  add_within_20: {
    id: 'add_within_20', label: 'Add ≤20', grade: 1,
    prereqs: ['add_within_10'], masteryThreshold: 0.85,
    visualType: 'add_blocks',
  },
  sub_within_20: {
    id: 'sub_within_20', label: 'Sub ≤20', grade: 1,
    prereqs: ['sub_within_10'], masteryThreshold: 0.85,
    visualType: 'sub_blocks',
  },
  add_2digit: {
    id: 'add_2digit', label: '2-Digit Add', grade: 2,
    prereqs: ['add_within_20'], masteryThreshold: 0.80,
    visualType: 'add_blocks',
  },
  sub_2digit: {
    id: 'sub_2digit', label: '2-Digit Sub', grade: 2,
    prereqs: ['sub_within_20'], masteryThreshold: 0.80,
    visualType: 'sub_blocks',
  },
  mult_2s_5s: {
    id: 'mult_2s_5s', label: 'Mult 2,5,10', grade: 2,
    prereqs: ['add_within_10'], masteryThreshold: 0.80,
    visualType: 'array_grid',
  },
  mult_intro: {
    id: 'mult_intro', label: 'Mult 3–9', grade: 3,
    prereqs: ['mult_2s_5s'], masteryThreshold: 0.75,
    visualType: 'array_grid',
  },
  fractions_prop: {
    id: 'fractions_prop', label: 'Fractions', grade: 3,
    prereqs: ['add_within_20'], masteryThreshold: 0.75,
    visualType: 'fraction_bar',
  },
}

// Ordered from easiest to hardest for iteration
export const SKILL_ORDER = [
  'add_within_10', 'sub_within_10',
  'add_within_20', 'sub_within_20',
  'add_2digit', 'sub_2digit',
  'mult_2s_5s', 'mult_intro',
  'fractions_prop',
]

// ── Default mastery values ─────────────────────────────────────────────────────
// Returns a full mastery map initialized from whatever global_math_mastery
// was loaded from Redis (partial — unknown keys default to 0).
export function initMastery(globalMathMastery = {}) {
  const m = {}
  for (const id of SKILL_ORDER) {
    m[id] = globalMathMastery[id] ?? 0
  }
  return m
}

// ── Question generators ────────────────────────────────────────────────────────
// Each returns { skillId, prompt, answer, visual }
// `visual` is used by PitStop for the scaffolding display.

function rnd(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo }

export function generateQuestion(skillId) {
  switch (skillId) {
    case 'add_within_10': {
      const a = rnd(1, 9), b = rnd(1, 10 - a)
      return { skillId, prompt: `${a} + ${b}`, answer: a + b, visual: { type: 'add_blocks', a, b } }
    }
    case 'sub_within_10': {
      const a = rnd(2, 9), b = rnd(1, a - 1)
      return { skillId, prompt: `${a} − ${b}`, answer: a - b, visual: { type: 'sub_blocks', a, b } }
    }
    case 'add_within_20': {
      // At least one operand must push sum above 10
      const a = rnd(3, 15), b = rnd(Math.max(1, 11 - a), Math.min(9, 20 - a))
      return { skillId, prompt: `${a} + ${b}`, answer: a + b, visual: { type: 'add_blocks', a, b } }
    }
    case 'sub_within_20': {
      const a = rnd(11, 20), b = rnd(2, a - 5)
      return { skillId, prompt: `${a} − ${b}`, answer: a - b, visual: { type: 'sub_blocks', a, b } }
    }
    case 'add_2digit': {
      const a = rnd(11, 70), b = rnd(10, Math.min(49, 99 - a))
      return { skillId, prompt: `${a} + ${b}`, answer: a + b, visual: { type: 'add_blocks', a, b } }
    }
    case 'sub_2digit': {
      const a = rnd(30, 99), b = rnd(10, a - 10)
      return { skillId, prompt: `${a} − ${b}`, answer: a - b, visual: { type: 'sub_blocks', a, b } }
    }
    case 'mult_2s_5s': {
      const base = [2, 5, 10][rnd(0, 2)]
      const mult = rnd(2, 10)
      return {
        skillId, prompt: `${base} × ${mult}`, answer: base * mult,
        visual: { type: 'array_grid', rows: Math.min(base, mult), cols: Math.max(base, mult) }
      }
    }
    case 'mult_intro': {
      const a = rnd(3, 9), b = rnd(3, 9)
      return {
        skillId, prompt: `${a} × ${b}`, answer: a * b,
        visual: { type: 'array_grid', rows: Math.min(a, b), cols: Math.max(a, b) }
      }
    }
    case 'fractions_prop': {
      const denoms = [2, 3, 4]
      const denom = denoms[rnd(0, 2)]
      const num   = rnd(1, denom - 1)
      const whole = denom * rnd(1, 4)
      return {
        skillId, prompt: `${num}/${denom} of ${whole}`, answer: (num / denom) * whole,
        visual: { type: 'fraction_bar', numerator: num, denominator: denom }
      }
    }
    default:
      return generateQuestion('add_within_20')
  }
}

// ── Boss question (one grade level above current) ──────────────────────────────
export function generateBossQuestion(currentSkillId) {
  const idx = SKILL_ORDER.indexOf(currentSkillId)
  const bossSkillId = SKILL_ORDER[Math.min(idx + 2, SKILL_ORDER.length - 1)]
  return { ...generateQuestion(bossSkillId), isBoss: true }
}
