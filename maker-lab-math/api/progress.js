/**
 * Maker Lab student progress API — patched to unified schema v2
 *
 * GET  ?name=NICO           → { exists, data: fullProfile }
 * POST { name, data }       → merge-safe write for game='maker_lab' only
 *
 * Redis key: student:NICO (unified with all other games)
 * Never overwrites other games' state objects.
 *
 * Backward-compat: still accepts old { name, data } POST body and maps it
 * into game_states.maker_lab inside the unified schema.
 */

import { Redis } from '@upstash/redis'
import { REDIS_KEY, defaultProfile, mergeProfile } from '../../shared/schema.js'

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

const mockStore = new Map()

async function dbGet(key) {
  if (redis) return redis.get(key)
  return mockStore.get(key) ?? null
}

async function dbSet(key, value) {
  if (redis) return redis.set(key, value)
  mockStore.set(key, value)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const name = req.query?.name
    if (!name) return res.status(400).json({ error: 'name required' })

    const existing = await dbGet(REDIS_KEY(name))
    if (!existing) return res.status(200).json({ exists: false, data: null })

    // Surface the maker_lab game_state as `data` so existing sync.js code works
    return res.status(200).json({ exists: true, data: existing })
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { return res.status(400).json({ error: 'invalid JSON' }) }
    }

    const { name, data } = body ?? {}
    if (!name || !data) return res.status(400).json({ error: 'name and data required' })

    const key = REDIS_KEY(name)
    const existing = (await dbGet(key)) ?? defaultProfile(name)

    // `data` is the Maker Lab blob: { profile, currency, blueprints, streak }
    // Nest it safely into game_states.maker_lab — no other game is touched
    const updated = mergeProfile(existing, {
      game: 'maker_lab',
      game_state: data,
    })

    await dbSet(key, updated)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
