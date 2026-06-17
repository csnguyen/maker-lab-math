/**
 * Hybrid sync engine.
 *
 * In DEV (no VITE_USE_API env var): uses localStorage-backed mock so the app
 * works without a Vercel deployment or KV credentials.
 *
 * In PROD (or when VITE_USE_API=true): calls /api/progress serverless route,
 * which writes to Vercel KV. localStorage is kept as an offline fallback.
 */

import {
  loadProfile, saveProfile,
  loadCurrency, saveCurrency,
  loadBlueprintState, saveBlueprintState,
  loadStreak,
} from './mastery.js'

const USE_API = import.meta.env.VITE_USE_API === 'true'

const PLAYER_KEY = 'maker_lab_player'

// ── Player identity ──────────────────────────────────────────────────────────

export function loadPlayerName() {
  try { return localStorage.getItem(PLAYER_KEY) || null } catch { return null }
}

export function savePlayerName(name) {
  localStorage.setItem(PLAYER_KEY, name)
}

export function clearPlayerName() {
  localStorage.removeItem(PLAYER_KEY)
}

// ── Bundle all local state into one object ───────────────────────────────────

export function bundleLocalState() {
  return {
    profile: loadProfile(),
    currency: loadCurrency(),
    blueprints: loadBlueprintState(),
    streak: loadStreak(),
  }
}

export function applyRemoteState(remoteData) {
  if (remoteData.profile)   saveProfile(remoteData.profile)
  if (remoteData.currency)  saveCurrency(remoteData.currency)
  if (remoteData.blueprints) saveBlueprintState(remoteData.blueprints)
  // streak is computed at load time from its own key; merge cautiously
  if (remoteData.streak) {
    try { localStorage.setItem('maker_lab_streak', JSON.stringify(remoteData.streak)) } catch {}
  }
}

// ── Network calls (or mock) ──────────────────────────────────────────────────

export async function fetchProgress(playerName) {
  if (!USE_API) return mockGet(playerName)
  try {
    const res = await fetch(`/api/progress?name=${encodeURIComponent(playerName)}`)
    if (!res.ok) throw new Error('API error')
    return res.json()
  } catch (err) {
    console.warn('Cloud fetch failed, using local fallback:', err)
    return bundleLocalState()
  }
}

export async function pushProgress(playerName, data) {
  if (!USE_API) { mockPost(playerName, data); return }
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, data }),
    })
  } catch (err) {
    console.warn('Cloud push failed (data already saved locally):', err)
  }
}

// ── Mock "database" (localStorage-backed, simulates the KV API in dev) ───────

function mockKey(playerName) {
  return `maker_lab_cloud_mock_${playerName.toLowerCase()}`
}

function mockGet(playerName) {
  try {
    const raw = localStorage.getItem(mockKey(playerName))
    if (raw) return JSON.parse(raw)
  } catch {}
  // No cloud record: return whatever is already in localStorage
  // (first login for a new player uses fresh defaults from loadProfile())
  return bundleLocalState()
}

function mockPost(playerName, data) {
  try {
    localStorage.setItem(mockKey(playerName), JSON.stringify(data))
  } catch {}
}
