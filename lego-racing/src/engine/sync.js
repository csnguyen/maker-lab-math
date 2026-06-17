/**
 * Lego Racing sync engine
 * VITE_USE_API=false → localStorage mock (no credentials needed)
 * VITE_USE_API=true  → real /api/progress with Upstash Redis
 */

const USE_API = import.meta.env.VITE_USE_API === 'true'
const MOCK_PREFIX = 'lego_racing_mock_'

// ── Player identity ───────────────────────────────────────────────────────────

export function loadPlayerName() {
  return localStorage.getItem('lego_racing_player') || null
}

export function savePlayerName(name) {
  localStorage.setItem('lego_racing_player', name)
}

export function clearPlayerName() {
  localStorage.removeItem('lego_racing_player')
}

// ── Local game state ──────────────────────────────────────────────────────────

export function loadLocalGameState() {
  try {
    const raw = localStorage.getItem('lego_racing_state')
    if (raw) return JSON.parse(raw)
  } catch {}
  return defaultGameState()
}

export function saveLocalGameState(state) {
  localStorage.setItem('lego_racing_state', JSON.stringify(state))
}

export function defaultGameState() {
  return {
    unlocked_tracks: [1],
    earned_coins: 0,
    equipped_car: {},
  }
}

// ── Mock API (localStorage-backed) ───────────────────────────────────────────

function mockKey(name) {
  return `${MOCK_PREFIX}${name.toUpperCase()}`
}

function mockGet(name) {
  try {
    const raw = localStorage.getItem(mockKey(name))
    if (raw) return { exists: true, data: JSON.parse(raw) }
  } catch {}
  return { exists: false, data: null }
}

function mockPost(name, gameState, globalMathMastery) {
  const existing = mockGet(name)
  const base = existing.data ?? {
    student_name: name.toUpperCase(),
    global_math_mastery: { add_2digit: 0.0, mult_intro: 0.0, fractions_prop: 0.0 },
    game_states: {
      maker_lab: { unlocked_blueprints: [], currency: 0 },
      lego_racing: defaultGameState(),
    },
  }

  const updated = {
    ...base,
    global_math_mastery: { ...base.global_math_mastery, ...globalMathMastery },
    game_states: {
      ...base.game_states,
      lego_racing: { ...(base.game_states?.lego_racing ?? {}), ...gameState },
    },
  }

  localStorage.setItem(mockKey(name), JSON.stringify(updated))
  return updated
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchProgress(playerName) {
  if (!USE_API) return mockGet(playerName)
  const res = await fetch(`/api/progress?name=${encodeURIComponent(playerName)}`)
  return res.json()
}

export async function pushProgress(playerName, gameState, globalMathMastery = {}) {
  if (!USE_API) {
    mockPost(playerName, gameState, globalMathMastery)
    return
  }
  await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: playerName,
      game: 'lego_racing',
      game_state: gameState,
      global_math_mastery: globalMathMastery,
    }),
  })
}

/** Apply a full profile fetched from the server back to local state */
export function applyRemoteProfile(profile) {
  if (!profile) return
  const gs = profile.game_states?.lego_racing
  if (gs) saveLocalGameState(gs)
}
