import { getAuthenticatedAccessToken } from '../lib/authSession.js'

/** Load session + refresh Discord token if needed. Throws 401 when not signed in. */
export async function requireDiscordToken(req, res) {
  const { accessToken } = await getAuthenticatedAccessToken(req, res)
  return accessToken
}
