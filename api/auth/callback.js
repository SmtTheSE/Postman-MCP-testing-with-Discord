import {
  exchangeCodeForToken,
  fetchDiscordUser,
  getRedirectUri,
} from '../../lib/discordOAuth.js'
import { createSession } from '../../lib/session.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, error: oauthError } = req.query || {}
  if (oauthError) {
    return res.redirect(302, '/?auth=denied')
  }
  if (!code) {
    return res.status(400).json({ error: 'Missing OAuth code' })
  }

  try {
    const redirectUri = getRedirectUri(req)
    const tokens = await exchangeCodeForToken(code, redirectUri)
    const user = await fetchDiscordUser(tokens.access_token)

    // Validate token via Discord REST (same endpoint as MCP get_my_oauth2_authorization)
    const { validateUserToken } = await import('../../lib/discordUserApi.js')
    await validateUserToken(tokens.access_token)

    await createSession(res, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: Date.now() + (tokens.expires_in || 604800) * 1000,
      userId: user.id,
      username: user.username,
      globalName: user.global_name || user.username,
      avatar: user.avatar,
    })

    res.redirect(302, '/?auth=success')
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.redirect(302, '/?auth=error')
  }
}
