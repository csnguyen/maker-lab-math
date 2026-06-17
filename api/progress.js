/**
 * Vercel serverless function: /api/progress
 *
 * GET  ?name=<player>  → fetch progress from Upstash Redis (returns { exists, data })
 * POST body: { name, data } → write progress to Upstash Redis
 *
 * Uses real Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * env vars are present. Falls back to an in-memory Map automatically when they
 * are not (local dev without credentials).
 */

import { Redis } from '@upstash/redis'

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// In-memory fallback for local dev without credentials
const mockStore = new Map()

function kvKey(playerName) {
  return `maker_lab:${playerName.toLowerCase()}`
}

async function dbGet(key) {
  if (redis) return redis.get(key)       // returns parsed value or null
  return mockStore.get(key) ?? null
}

async function dbSet(key, value) {
  if (redis) return redis.set(key, value) // Upstash serialises automatically
  mockStore.set(key, value)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const name = req.query?.name
    if (!name) return res.status(400).json({ error: 'name required' })

    const data = await dbGet(kvKey(name))
    if (!data) return res.status(200).json({ exists: false, data: null })
    return res.status(200).json({ exists: true, data })
  }

  if (req.method === 'POST') {
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { return res.status(400).json({ error: 'invalid JSON' }) }
    }
    const { name, data } = body ?? {}
    if (!name || !data) return res.status(400).json({ error: 'name and data required' })

    await dbSet(kvKey(name), data)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
