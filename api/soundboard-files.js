import path from 'path'
import { getUploadedSoundPath } from '../lib/music/soundboard.js'

const MIME = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { guildId, filename } = req.params
    const filePath = getUploadedSoundPath(guildId, filename)
    const ext = path.extname(filePath).toLowerCase()
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
    return res.sendFile(filePath)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'File not found' })
  }
}
