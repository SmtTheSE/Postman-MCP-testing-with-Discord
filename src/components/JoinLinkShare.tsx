import { Copy, Share2, ExternalLink, CheckCircle2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildShareMessage } from '../lib/channelNaming'

interface JoinLinkShareProps {
  inviteUrl: string
  channelName: string
  gameName: string
  onCreateAnother: () => void
  onRecreateSimilar?: () => void
  isSubmitting?: boolean
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

export function JoinLinkShare({
  inviteUrl,
  channelName,
  gameName,
  onCreateAnother,
  onRecreateSimilar,
  isSubmitting,
}: JoinLinkShareProps) {
  const [copied, setCopied] = useState(false)
  const shareText = buildShareMessage(channelName, gameName, inviteUrl)

  useEffect(() => {
    copyToClipboard(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [shareText])

  const handleCopy = async () => {
    await copyToClipboard(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: channelName, text: shareText, url: inviteUrl })
        return
      } catch {
        /* fall through */
      }
    }
    handleCopy()
  }

  return (
    <div className="page-stack">
      <div className="text-center py-4">
        <CheckCircle2 className="w-16 h-16 text-[#34C759] mx-auto mb-5" strokeWidth={1.5} />
        <h2 className="text-[26px] font-bold text-black tracking-tight">Channel created</h2>
        <p className="text-[16px] text-muted mt-2 leading-relaxed">
          <span className="font-medium text-black">{channelName}</span>
          {gameName ? ` · ${gameName}` : ''}
        </p>
        {copied && (
          <p className="text-[14px] text-[#34C759] font-medium mt-3">Invite copied — paste in Discord or group chat</p>
        )}
      </div>

      <section>
        <p className="ios-section-title">Invite link</p>
        <div className="ios-group ios-group-padded">
          <p className="text-[15px] text-accent break-all leading-relaxed select-all">{inviteUrl}</p>
        </div>
      </section>

      <div className="btn-row">
        <button
          type="button"
          onClick={handleCopy}
          className="ios-btn-secondary flex items-center justify-center gap-2"
        >
          <Copy className="w-[18px] h-[18px]" strokeWidth={2} />
          {copied ? 'Copied' : 'Copy message'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="ios-btn-primary flex items-center justify-center gap-2"
        >
          <Share2 className="w-[18px] h-[18px]" strokeWidth={2} />
          Share
        </button>
      </div>

      <button
        type="button"
        onClick={() => window.open(inviteUrl, '_blank', 'noopener,noreferrer')}
        className="ios-btn-secondary flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-[18px] h-[18px]" strokeWidth={2} />
        Open in Discord
      </button>

      {onRecreateSimilar && (
        <button
          type="button"
          onClick={onRecreateSimilar}
          disabled={isSubmitting}
          className="ios-btn-secondary flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2} />
          {isSubmitting ? 'Creating…' : 'Create another (same setup)'}
        </button>
      )}

      <button
        type="button"
        onClick={onCreateAnother}
        className="w-full py-4 text-[16px] font-medium text-muted"
      >
        Start fresh
      </button>
    </div>
  )
}
