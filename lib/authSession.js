import { getSession, createSession } from './session.js'
import { refreshDiscordToken } from './discordOAuth.js'

const EXPIRY_BUFFER_MS = 5 * 60 * 1000

/** @type {Map<string, Promise<{ accessToken: string; session: object }>>} */
const refreshInflight = new Map()

function sessionKey(session) {
  return session.userId || session.refreshToken || session.accessToken || 'anon'
}

async function refreshSessionTokens(session, res) {
  const key = sessionKey(session)
  const existing = refreshInflight.get(key)
  if (existing) return existing

  const promise = (async () => {
    const tokens = await refreshDiscordToken(session.refreshToken)
    const updated = {
      ...session,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || session.refreshToken,
      tokenExpiresAt: Date.now() + (tokens.expires_in || 604800) * 1000,
    }
    if (res) await createSession(res, updated)
    return { accessToken: tokens.access_token, session: updated }
  })().finally(() => {
    refreshInflight.delete(key)
  })

  refreshInflight.set(key, promise)
  return promise
}

/** Returns a valid Discord access token, refreshing when needed. */
export async function getAuthenticatedAccessToken(req, res) {
  const session = await getSession(req)
  if (!session) {
    throw Object.assign(new Error('Sign in with Discord first'), { status: 401, code: 'NOT_AUTHENTICATED' })
  }

  const expiresAt = session.tokenExpiresAt ? Number(session.tokenExpiresAt) : 0
  const isExpired = expiresAt > 0 && Date.now() >= expiresAt - EXPIRY_BUFFER_MS

  if (session.refreshToken && (isExpired || !session.accessToken)) {
    try {
      return await refreshSessionTokens(session, res)
    } catch (err) {
      if (!session.accessToken) {
        throw Object.assign(new Error('Discord session expired — sign out and sign in again'), {
          status: 401,
          code: 'TOKEN_EXPIRED',
          details: err.details,
        })
      }
    }
  }

  if (session.accessToken) {
    return { accessToken: session.accessToken, session }
  }

  throw Object.assign(new Error('Sign in with Discord first'), { status: 401, code: 'NOT_AUTHENTICATED' })
}
