/**
 * Lego Racing sync engine
 * VITE_USE_API=false → localStorage mock (no credentials needed)
 * VITE_USE_API=true  → real /api/progress with Upstash Redis
 *
 * Offline resilience:
 *  - mastery is written to localStorage after every race
 *  - on login, remote + local mastery are merged (take max per key)
 *  - so a network drop mid-race can't erase earned progress
 */

const USE_API = import.meta.env.VITE_USE_API === 'true'
const MOCK_PREFIX        = 'lego_racing_mock_'
const LOCAL_MASTERY_KEY  = 'lego_racing_mastery'
const LOCAL_STATE_KEY    = 'lego_racing_state'
const LOCAL_PLAYER_KEY   = 'lego_racing_player'

// ── Player identity ───────────────────────────────────────────────────────────

export function loadPlayerName() {
  return localStorage.getItem(LOCAL_PLAYER_KEY) || null
}
export function savePlayerName(name) {
  localStorage.setItem(LOCAL_PLAYER_KEY, name)
}
export function clearPlayerName() {
  localStorage.removeItem(LOCAL_PLAYER_KEY)
}

// ── Local game state ──────────────────────────────────────────────────────────

export function loadLocalGameState() {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY)
    if (raw) {
      const gs = JSON.parse(raw)
      // Ensure new keys added in later versions are present
      return { ...defaultGameState(), ...gs }
    }
  } catch {}
  return defaultGameState()
}

export function saveLocalGameState(state) {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state))
}

export function defaultGameState() {
  return {
    unlocked_tracks: [1],
    earned_coins: 0,
    equipped_car: { engine: null, tires: null, aero: null, brakes: null },
    owned_parts: [],
  }
}

// ── Local mastery (offline fallback) ─────────────────────────────────────────

export function loadLocalMastery() {
  try {
    const raw = localStorage.getItem(LOCAL_MASTERY_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

export function saveLocalMastery(mastery) {
  localStorage.setItem(LOCAL_MASTERY_KEY, JSON.stringify(mastery))
}

/**
 * Merge remote mastery from Upstash with locally-cached mastery.
 * For each key, take the HIGHER value — protects progress on network drops.
 */
export function mergeMastery(remote = {}, local = {}) {
  const merged = { ...remote }
  for (const key of Object.keys(local)) {
    merged[key] = Math.max(remote[key] ?? 0, local[key] ?? 0)
  }
  return merged
}

// ── Mock API (localStorage-backed, exact same shape as Upstash profile) ───────

function mockKey(name) { return `${MOCK_PREFIX}${name.toUpperCase()}` }

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
    global_math_mastery: {},
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
      lego_racing: { ...defaultGameState(), ...(base.game_states?.lego_racing ?? {}), ...gameState },
    },
  }

  localStorage.setItem(mockKey(name), JSON.stringify(updated))
  return updated
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchProgress(playerName) {
  if (!USE_API) return mockGet(playerName)
  try {
    const res = await fetch(`/api/progress?name=${encodeURIComponent(playerName)}`)
    if (!res.ok) throw new Error('fetch failed')
    return res.json()
  } catch {
    // Network error — return local state as "exists" so game can continue
    const local = mockGet(playerName)
    if (!local.exists) {
      const cached = loadLocalGameState()
      const mastery = loadLocalMastery()
      return {
        exists: false,
        data: {
          student_name: playerName.toUpperCase(),
          global_math_mastery: mastery,
          game_states: { lego_racing: cached },
        },
        offline: true,
      }
    }
    return { ...local, offline: true }
  }
}

export async function pushProgress(playerName, gameState, globalMathMastery = {}) {
  // Always write locally first (offline resilience)
  saveLocalGameState(gameState)
  if (Object.keys(globalMathMastery).length > 0) {
    const current = loadLocalMastery()
    saveLocalMastery(mergeMastery(current, globalMathMastery))
  }

  if (!USE_API) {
    mockPost(playerName, gameState, globalMathMastery)
    return { ok: true, source: 'mock' }
  }
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: playerName,
        game: 'lego_racing',
        game_state: gameState,
        global_math_mastery: globalMathMastery,
      }),
    })
    return { ok: res.ok, source: 'redis' }
  } catch {
    return { ok: false, source: 'offline' }
  }
}

/** Apply a full profile fetched from the server back to local state */
export function applyRemoteProfile(profile) {
  if (!profile) return
  const gs = profile.game_states?.lego_racing
  if (gs) saveLocalGameState({ ...defaultGameState(), ...gs })
  if (profile.global_math_mastery) {
    const local = loadLocalMastery()
    saveLocalMastery(mergeMastery(profile.global_math_mastery, local))
  }
}

// ── Cross-game sync test helper ────────────────────────────────────────────────
/**
 * Seeds a player profile with advanced mastery to verify ZPD skip-logic.
 * Used by the dashboard's "Test Cross-Game Sync" button.
 * Returns a description of what skill the racing game would start on.
 */
export function seedAdvancedProfile(testName = 'TESTPRO') {
  const advancedMastery = {
    add_within_10:  0.95,
    sub_within_10:  0.95,
    add_within_20:  0.95,
    sub_within_20:  0.90,
    add_2digit:     0.88,   // mastered
    sub_2digit:     0.72,   // in progress
    mult_2s_5s:     0.65,   // active ZPD target
    mult_intro:     0.30,   // next up
    fractions_prop: 0.10,
  }
  const profile = {
    student_name: testName.toUpperCase(),
    global_math_mastery: advancedMastery,
    game_states: {
      maker_lab: { unlocked_blueprints: ['blueprint_004', 'blueprint_007'], currency: 150 },
      lego_racing: { ...defaultGameState(), earned_coins: 45 },
    },
  }
  localStorage.setItem(`${MOCK_PREFIX}${testName.toUpperCase()}`, JSON.stringify(profile))
  saveLocalMastery(advancedMastery)
  return { profile, advancedMastery }
}
