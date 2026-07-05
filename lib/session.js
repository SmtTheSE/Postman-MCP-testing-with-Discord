import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'voicedrop_session'

function getSecret() {
  const raw =
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'voicedrop-dev-session-secret' : null)
  if (!raw) {
    throw Object.assign(new Error('SESSION_SECRET is not set'), { status: 503 })
  }
  return new TextEncoder().encode(raw)
}

function cookieFlags() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax${secure}`
}

export async function createSession(res, payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())

  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; ${cookieFlags()}; Max-Age=604800`)
}

export async function getSession(req) {
  const header = req.headers.cookie
  if (!header) return null

  const match = header.split(';').find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
  if (!match) return null

  const token = match.trim().slice(COOKIE_NAME.length + 1)
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${cookieFlags()}; Max-Age=0`)
}
