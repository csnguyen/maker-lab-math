/**
 * Centralized student profile schema shared across all games.
 *
 * Redis key pattern:  student:NICO  (always uppercase name)
 * All game serverless functions import helpers from this file.
 *
 * Schema:
 * {
 *   student_name: "NICO",
 *   global_math_mastery: { add_2digit: 0.0, mult_intro: 0.0, fractions_prop: 0.0 },
 *   game_states: {
 *     maker_lab:   { unlocked_blueprints: [], currency: 0 },
 *     lego_racing: { unlocked_tracks: [1], earned_coins: 0, equipped_car: {} }
 *   }
 * }
 */

export const REDIS_KEY = (name) => `student:${name.toUpperCase()}`

/** Default profile shape — never stored directly, used to provision new students */
export function defaultProfile(studentName) {
  return {
    student_name: studentName.toUpperCase(),
    global_math_mastery: {
      add_2digit: 0.0,
      mult_intro: 0.0,
      fractions_prop: 0.0,
    },
    game_states: {
      maker_lab: {
        unlocked_blueprints: [],
        currency: 0,
      },
      lego_racing: {
        unlocked_tracks: [1],
        earned_coins: 0,
        equipped_car: {},
      },
    },
  }
}

/**
 * Merge an incoming update into an existing profile.
 * - global_math_mastery: shallow-merged (only provided keys overwritten)
 * - game_states[game]: deep-merged (only provided game's state overwritten)
 * - Other games' states are NEVER touched.
 */
export function mergeProfile(existing, update) {
  const merged = structuredClone(existing)

  // Merge global math mastery (only the keys the caller provides)
  if (update.global_math_mastery) {
    merged.global_math_mastery = {
      ...merged.global_math_mastery,
      ...update.global_math_mastery,
    }
  }

  // Merge only the calling game's state
  if (update.game && update.game_state) {
    merged.game_states = {
      ...merged.game_states,
      [update.game]: {
        ...(merged.game_states?.[update.game] ?? {}),
        ...update.game_state,
      },
    }
  }

  return merged
}
