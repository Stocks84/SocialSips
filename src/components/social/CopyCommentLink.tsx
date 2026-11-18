'use client'
import { useState } from 'react'
import { commentPermalink } from '@/lib/report-url'

/** Copies an absolute permalink to this comment so it can be pasted into /report or shared. */
export default function CopyCommentLink({ path, commentId }: { path: string; commentId: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}${commentPermalink(path, commentId)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs text-ink-3 hover:text-ink"
      data-testid="copy-comment-link"
      aria-label="Copy link to this comment"
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}
