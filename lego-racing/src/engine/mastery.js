/**
 * ZPD-based mastery engine for Lego Racing.
 *
 * Mastery values live in global_math_mastery (shared with Maker Lab).
 * ZPD selection: serve questions at the skill where mastery is closest
 * to the learner's growing edge — not already mastered, prereqs satisfied.
 */

import { SKILLS, SKILL_ORDER } from './curriculum.js'

// ── Mastery update (Elo-style) ─────────────────────────────────────────────────
const LEARN_RATE_FAST = 0.15   // correct + answered in <3s
const LEARN_RATE_SLOW = 0.08   // correct, took longer
const FORGET_RATE     = 0.07   // wrong answer

/**
 * Update mastery for a skill after one question.
 * @returns new mastery map (immutable, same reference on no change)
 */
export function updateMastery(mastery, skillId, correct, elapsedMs, fastThresholdMs = 3000) {
  const prev = mastery[skillId] ?? 0
  let next
  if (correct) {
    const rate = elapsedMs < fastThresholdMs ? LEARN_RATE_FAST : LEARN_RATE_SLOW
    next = prev + rate * (1 - prev)
  } else {
    next = prev - FORGET_RATE * prev
  }
  next = Math.max(0, Math.min(1, next))
  if (Math.abs(next - prev) < 0.001) return mastery
  return { ...mastery, [skillId]: next }
}

/**
 * Skip-logic: slam a skill to mastered (0.87) and also boost all prereqs.
 * Called when a boss question is answered in <3s.
 */
export function applySkipLogic(mastery, skillId) {
  const skill = SKILLS[skillId]
  if (!skill) return mastery
  const result = { ...mastery, [skillId]: 0.87 }
  // Give partial credit to prereqs if they were low
  for (const prereq of skill.prereqs ?? []) {
    if ((result[prereq] ?? 0) < 0.7) result[prereq] = 0.72
  }
  return result
}

// ── ZPD skill selector ─────────────────────────────────────────────────────────
/**
 * Pick the best skill to practice right now.
 *
 * Algorithm:
 * 1. Filter to skills where:
 *    a. All prereqs have mastery ≥ 0.70 (unlocked)
 *    b. Own mastery < masteryThreshold (not yet mastered)
 * 2. Among eligible, prefer the skill whose mastery is closest to 0.60
 *    (just below the "confident" zone — still productive learning).
 * 3. Fallback: if all mastered, cycle the two hardest skills.
 */
export function selectSkill(mastery) {
  const eligible = SKILL_ORDER.filter(id => {
    const skill = SKILLS[id]
    const m = mastery[id] ?? 0
    if (m >= skill.masteryThreshold) return false
    return skill.prereqs.every(p => (mastery[p] ?? 0) >= 0.70)
  })

  if (eligible.length === 0) {
    // All mastered — review the hardest skills
    return SKILL_ORDER[SKILL_ORDER.length - 1]
  }

  // Pick the one closest to the sweet-spot mastery of 0.60
  const SWEET = 0.60
  return eligible.sort((a, b) =>
    Math.abs((mastery[a] ?? 0) - SWEET) - Math.abs((mastery[b] ?? 0) - SWEET)
  )[0]
}

// ── Mastery summary for HUD ────────────────────────────────────────────────────
/**
 * Returns the fraction of the skill tree that is mastered (0–1).
 */
export function masteryProgress(mastery) {
  const mastered = SKILL_ORDER.filter(id => (mastery[id] ?? 0) >= SKILLS[id].masteryThreshold).length
  return mastered / SKILL_ORDER.length
}

/**
 * Extract only the keys that changed during a session for the sync payload.
 * Returns only the delta so we don't overwrite other games' keys.
 */
export function masteryDelta(before, after) {
  const delta = {}
  for (const id of SKILL_ORDER) {
    const a = before[id] ?? 0
    const b = after[id] ?? 0
    if (Math.abs(b - a) > 0.001) delta[id] = b
  }
  return delta
}
