import { Copy, Share2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

interface JoinLinkShareProps {
  inviteUrl: string
  channelName: string
  gameName: string
  onCreateAnother: () => void
}

export function JoinLinkShare({ inviteUrl, channelName, gameName, onCreateAnother }: JoinLinkShareProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = inviteUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const text = `Join "${channelName}" for ${gameName}\n${inviteUrl}`
    if (navigator.share) {
      try {
        await navigator.share({ title: channelName, text, url: inviteUrl })
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
        <p className="text-[16px] text-[#8E8E93] mt-2 leading-relaxed">
          <span className="font-medium text-black">{channelName}</span>
          {gameName ? ` · ${gameName}` : ''}
        </p>
      </div>

      <section>
        <p className="ios-section-title">Invite link</p>
        <div className="ios-group ios-group-padded">
          <p className="text-[15px] text-[#007AFF] break-all leading-relaxed select-all">{inviteUrl}</p>
        </div>
      </section>

      <div className="btn-row">
        <button
          type="button"
          onClick={handleCopy}
          className="ios-btn-secondary flex items-center justify-center gap-2"
        >
          <Copy className="w-[18px] h-[18px]" strokeWidth={2} />
          {copied ? 'Copied' : 'Copy'}
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

      <button
        type="button"
        onClick={onCreateAnother}
        className="w-full py-4 text-[16px] font-medium text-[#8E8E93]"
      >
        Create another
      </button>
    </div>
  )
}
