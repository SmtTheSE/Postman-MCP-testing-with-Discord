import { getSession } from '../../lib/session.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getSession(req)
    if (!session) {
      return res.status(401).json({ authenticated: false })
    }

    res.status(200).json({
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        globalName: session.globalName,
        avatar: session.avatar,
      },
    })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
}
