/**
 * Unified student progress API — lego-racing
 *
 * GET  ?name=NICO           → { exists, data: fullProfile }
 * POST { name, game, game_state, global_math_mastery }
 *                           → merge-safe write; never touches other games
 *
 * Uses Upstash Redis when env vars present, falls back to in-memory Map.
 * Schema lives in ../../shared/schema.js
 */

import { Redis } from '@upstash/redis'
import { REDIS_KEY, defaultProfile, mergeProfile } from '../shared/schema.js'

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
    return res.status(200).json({ exists: true, data: existing })
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { return res.status(400).json({ error: 'invalid JSON' }) }
    }

    const { name, game, game_state, global_math_mastery } = body ?? {}
    if (!name) return res.status(400).json({ error: 'name required' })

    const key = REDIS_KEY(name)
    const existing = (await dbGet(key)) ?? defaultProfile(name)
    const updated = mergeProfile(existing, { game, game_state, global_math_mastery })

    await dbSet(key, updated)
    return res.status(200).json({ ok: true, data: updated })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
