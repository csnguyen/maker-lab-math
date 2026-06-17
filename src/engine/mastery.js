import { SKILLS, QUESTIONS, STARTER_SKILLS } from '../data/curriculum.js'

const STORAGE_KEY = 'maker_lab_profile'
const STREAK_KEY = 'maker_lab_streak'
const CURRENCY_KEY = 'maker_lab_currency'
const BLUEPRINTS_KEY = 'maker_lab_blueprints'

// ── Profile management ──────────────────────────────────────────────────────

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // Merge any new skills added in curriculum updates without wiping existing progress
      const merged = { ...saved }
      SKILLS.forEach(s => {
        if (!merged.skills[s.id]) {
          merged.skills[s.id] = {
            skill_id: s.id,
            mastery_score: 0,
            speed_rating: 1.0,
            attempts: 0,
            next_review_date: Date.now(),
            unlocked: STARTER_SKILLS.includes(s.id),
            consecutive_correct: 0,
          }
        }
      })
      return merged
    }
  } catch {}
  return createInitialProfile()
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

// Skills a rising 2nd grader who knows add/sub within 20 has already mastered.
// Pre-seeding these triggers the unlockNextSkills cascade so they start at an
// appropriate level (doubles, 2-digit addition, missing addend) rather than
// getting trivial questions they already know cold.
const PREMASTERED = {
  add_within_10: 0.95,
  add_within_20: 0.95,
  sub_within_10: 0.95,
  sub_within_20: 0.90,
}

function createInitialProfile() {
  const now = Date.now()
  const skills = {}
  SKILLS.forEach(s => {
    const pre = PREMASTERED[s.id]
    skills[s.id] = {
      skill_id: s.id,
      mastery_score: pre ?? (STARTER_SKILLS.includes(s.id) ? 0.3 : 0),
      speed_rating: 1.0,
      attempts: pre ? 4 : 0,
      next_review_date: now,
      unlocked: !!(pre || STARTER_SKILLS.includes(s.id)),
      consecutive_correct: pre ? 4 : 0,
    }
  })

  let profile = { skills, totalBolts: 10, totalBricks: 5, createdAt: now, lastSession: null }

  // Run the unlock cascade for every premastered skill so their successors open up
  Object.keys(PREMASTERED).forEach(skillId => {
    profile = unlockNextSkills(profile, skillId)
  })

  return profile
}

// ── Streak management ───────────────────────────────────────────────────────

export function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      const today = new Date().toDateString()
      const lastDay = new Date(data.lastDate).toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      if (lastDay === today) return data
      if (lastDay === yesterday) return data
      return { count: 0, lastDate: data.lastDate }
    }
  } catch {}
  return { count: 0, lastDate: null }
}

export function updateStreak() {
  const streak = loadStreak()
  const today = new Date().toDateString()
  const lastDay = streak.lastDate ? new Date(streak.lastDate).toDateString() : null
  if (lastDay === today) return streak
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const newCount = lastDay === yesterday ? streak.count + 1 : 1
  const newStreak = { count: newCount, lastDate: Date.now() }
  localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak))
  return newStreak
}

// ── Currency ────────────────────────────────────────────────────────────────

export function loadCurrency() {
  try {
    const raw = localStorage.getItem(CURRENCY_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { bolts: 10, bricks: 5 }
}

export function saveCurrency(c) {
  localStorage.setItem(CURRENCY_KEY, JSON.stringify(c))
}

// ── Blueprints ──────────────────────────────────────────────────────────────

export const BLUEPRINTS = [
  {
    id: 'rocket',
    name: 'Rocket Launcher',
    emoji: '🚀',
    boltCost: 10,
    brickCost: 5,
    parts: ['Nose Cone', 'Fuel Tank', 'Booster', 'Launch Pad'],
    unlocked: true,
  },
  {
    id: 'goalie',
    name: 'Robotic Goalie',
    emoji: '🤖',
    boltCost: 15,
    brickCost: 8,
    parts: ['Head', 'Arms', 'Torso', 'Legs', 'Goal Net'],
    unlocked: false,
  },
  {
    id: 'catapult',
    name: 'LEGO Catapult',
    emoji: '⚙️',
    boltCost: 20,
    brickCost: 12,
    parts: ['Base', 'Arm', 'Sling', 'Counterweight', 'Trigger'],
    unlocked: false,
  },
  {
    id: 'submarine',
    name: 'Mini Submarine',
    emoji: '🌊',
    boltCost: 25,
    brickCost: 15,
    parts: ['Hull', 'Periscope', 'Propeller', 'Hatch', 'Torpedo Bay'],
    unlocked: false,
  },
]

export function loadBlueprintState() {
  try {
    const raw = localStorage.getItem(BLUEPRINTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const initial = {}
  BLUEPRINTS.forEach(b => { initial[b.id] = [] })
  return initial
}

export function saveBlueprintState(state) {
  localStorage.setItem(BLUEPRINTS_KEY, JSON.stringify(state))
}

// ── ZPD & Question Selection ────────────────────────────────────────────────

export function getZPDQuestions(profile, mode) {
  const unlockedSkills = Object.values(profile.skills).filter(s => s.unlocked)

  let targetSkills
  if (mode === 'warmup') {
    // Fast arithmetic drills
    targetSkills = unlockedSkills
      .filter(s => {
        const skill = SKILLS.find(sk => sk.id === s.skill_id)
        return skill && (skill.domain === 'arithmetic' || skill.domain === 'multiplication')
      })
      .sort((a, b) => a.mastery_score - b.mastery_score)
      .slice(0, 4)
  } else if (mode === 'quest') {
    // Word problems and algebra
    targetSkills = unlockedSkills
      .filter(s => {
        const skill = SKILLS.find(sk => sk.id === s.skill_id)
        return skill && (skill.domain === 'algebra' || skill.domain === 'place_value')
      })
  } else if (mode === 'boss') {
    // Best boss-style questions at or just above mastery level
    const avgMastery = unlockedSkills.reduce((sum, s) => sum + s.mastery_score, 0) / (unlockedSkills.length || 1)
    return QUESTIONS.filter(q => q.style === 'boss').slice(0, 1)
  }

  if (!targetSkills || targetSkills.length === 0) {
    targetSkills = unlockedSkills.slice(0, 3)
  }

  const skillIds = targetSkills.map(s => s.skill_id)
  const pool = QUESTIONS.filter(q => skillIds.includes(q.skill) && q.style !== 'boss')

  // Shuffle and return 3-5 questions
  return shuffle(pool).slice(0, mode === 'warmup' ? 8 : 4)
}

// ── Elo-style mastery update ────────────────────────────────────────────────

export function updateMastery(profile, skillId, correct, responseTimeMs) {
  const entry = profile.skills[skillId]
  if (!entry) return profile

  const speed = Math.min(1.0, 10000 / Math.max(responseTimeMs, 500))
  const delta = correct ? 0.12 * (1 + speed * 0.3) : -0.15
  const newScore = Math.max(0, Math.min(1.0, entry.mastery_score + delta))

  const newEntry = {
    ...entry,
    mastery_score: newScore,
    speed_rating: correct ? speed : entry.speed_rating,
    attempts: entry.attempts + 1,
    next_review_date: Date.now() + spacedRepetitionInterval(newScore),
    consecutive_correct: correct ? entry.consecutive_correct + 1 : 0,
  }

  const updated = {
    ...profile,
    skills: { ...profile.skills, [skillId]: newEntry },
  }

  // Skip-logic: if mastery >= 0.85 on first few attempts, unlock next skills
  if (newScore >= 0.85 && newEntry.attempts <= 5) {
    return unlockNextSkills(updated, skillId)
  }

  // Boss-level freeze: score > 0.95
  return updated
}

function spacedRepetitionInterval(mastery) {
  if (mastery > 0.95) return 7 * 24 * 60 * 60 * 1000 // 7 days
  if (mastery > 0.8) return 2 * 24 * 60 * 60 * 1000   // 2 days
  if (mastery > 0.6) return 1 * 24 * 60 * 60 * 1000   // 1 day
  return 4 * 60 * 60 * 1000                            // 4 hours
}

export function unlockNextSkills(profile, completedSkillId) {
  const updated = { ...profile, skills: { ...profile.skills } }
  SKILLS.forEach(skill => {
    if (
      !updated.skills[skill.id].unlocked &&
      skill.prereqs.includes(completedSkillId) &&
      skill.prereqs.every(prereqId => {
        const prereq = updated.skills[prereqId]
        return prereq && prereq.unlocked && prereq.mastery_score >= 0.6
      })
    ) {
      updated.skills[skill.id] = { ...updated.skills[skill.id], unlocked: true }
    }
  })
  return updated
}

// ── Skip-logic diagnostic ───────────────────────────────────────────────────

export function shouldSkipSkill(profile, skillId) {
  const entry = profile.skills[skillId]
  return entry && entry.mastery_score >= 0.85 && entry.attempts >= 2
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getSkillInfo(skillId) {
  return SKILLS.find(s => s.id === skillId)
}

export function getUnlockedSkillCount(profile) {
  return Object.values(profile.skills).filter(s => s.unlocked).length
}

export function getAverageMastery(profile) {
  const unlocked = Object.values(profile.skills).filter(s => s.unlocked)
  if (!unlocked.length) return 0
  return unlocked.reduce((sum, s) => sum + s.mastery_score, 0) / unlocked.length
}

export function getGradeEquivalent(profile) {
  const avg = getAverageMastery(profile)
  const unlocked = getUnlockedSkillCount(profile)
  if (avg > 0.85 && unlocked > 15) return '4th Grade'
  if (avg > 0.75 && unlocked > 10) return '3rd Grade'
  if (avg > 0.6 && unlocked > 6) return '2nd Grade+'
  return '2nd Grade'
}

// ── Import / Export ─────────────────────────────────────────────────────────

export function exportAllData() {
  return JSON.stringify({
    v: 1,
    profile: localStorage.getItem(STORAGE_KEY),
    streak: localStorage.getItem(STREAK_KEY),
    currency: localStorage.getItem(CURRENCY_KEY),
    blueprints: localStorage.getItem(BLUEPRINTS_KEY),
    exportedAt: new Date().toISOString(),
  })
}

export function importAllData(jsonString) {
  const data = JSON.parse(jsonString)
  if (!data.v || data.v !== 1) throw new Error('Unrecognised backup format')
  if (data.profile) localStorage.setItem(STORAGE_KEY, data.profile)
  if (data.streak) localStorage.setItem(STREAK_KEY, data.streak)
  if (data.currency) localStorage.setItem(CURRENCY_KEY, data.currency)
  if (data.blueprints) localStorage.setItem(BLUEPRINTS_KEY, data.blueprints)
}
