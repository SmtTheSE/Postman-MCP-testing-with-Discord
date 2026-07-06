import { buildPrometheusMetrics } from '../lib/music/metrics.js'

export default async function handler(_req, res) {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  res.status(200).send(buildPrometheusMetrics())
}
