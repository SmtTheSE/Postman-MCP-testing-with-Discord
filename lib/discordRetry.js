/** Retry Discord API calls when rate-limited (HTTP 429). */
export async function withDiscordRetry(fn, maxRetries = 2) {
  let lastErr
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const retryAfter = parseRetryAfter(err?.message)
      if (retryAfter == null || attempt === maxRetries) throw err
      await sleep(Math.ceil(retryAfter * 1000) + 100)
    }
  }
  throw lastErr
}

function parseRetryAfter(message = '') {
  const match = message.match(/HTTP 429:.*"retry_after"\s*:\s*([\d.]+)/)
  return match ? parseFloat(match[1]) : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isRateLimitError(message = '') {
  return message.includes('HTTP 429') || message.includes('rate limited')
}

export function formatRateLimitError(message = '') {
  const retryAfter = parseRetryAfter(message)
  if (retryAfter != null) {
    return `Discord is rate limiting requests. Wait ${Math.ceil(retryAfter)}s and try again.`
  }
  return 'Discord is rate limiting requests. Wait a moment and try again.'
}
