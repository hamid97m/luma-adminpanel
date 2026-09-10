import { useEffect, useState } from 'react'
import { api } from '../api'
import { MessageButtonEditor, buildButton, draftFromButton, type ButtonDraft } from './MessageButtonEditor'

const MAX_LEN = 4096

// Turn the backend's JSON error body into readable text.
function friendlyError(e: any): string {
  const raw = e?.message ?? ''
  let code = raw, detail = ''
  try { const p = JSON.parse(raw); code = p.error ?? raw; detail = p.detail ?? '' } catch { /* not JSON */ }
  switch (code) {
    case 'invalid_link': return 'That doesn’t look like a valid t.me message link.'
    case 'forward_source_unreachable':
      return `The bot can’t forward that message. Make sure it’s an admin/member of the channel.${detail ? ` (${detail})` : ''}`
    case 'empty_message': return 'Add a message before enabling.'
    case 'message_too_long': return 'Message is too long (max 4096 characters).'
    default: return code || 'Failed to save.'
  }
}

/**
 * Configures the one-time "abandoned checkout" auto-message: sent by a 30-min
 * job to users who started a premium purchase but never completed it.
 */
export default function PurchaseMessageCard() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<'text' | 'forward'>('text')
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [buttonDraft, setButtonDraft] = useState<ButtonDraft>(draftFromButton(null))
  const [sentCount, setSentCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.broadcasts.purchaseMessage.get()
      .then(({ config }) => {
        if (cancelled) return
        setEnabled(config.enabled)
        setMode(config.kind)
        if (config.kind === 'forward') setLink(config.message)
        else setText(config.message)
        setButtonDraft(draftFromButton(config.button))
        setSentCount(config.sentCount)
      })
      .catch(() => { /* leave defaults */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function save() {
    setError(null); setSaved(false)
    if (enabled) {
      if (mode === 'text' && !text.trim()) { setError('Add a message before enabling.'); return }
      if (mode === 'forward' && !link.trim()) { setError('Paste a channel message link before enabling.'); return }
    }
    setSaving(true)
    try {
      const { config } = await api.broadcasts.purchaseMessage.save(
        mode === 'forward'
          ? { enabled, kind: 'forward', link: link.trim() }
          : { enabled, kind: 'text', message: text.trim(), button: buildButton(buttonDraft) },
      )
      setSentCount(config.sentCount)
      setSaved(true)
    } catch (e: any) {
      setError(friendlyError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Abandoned checkout message</h2>
        <p className="text-xs text-gray-500 mt-1">
          Sent once, automatically, to each user who opens a premium checkout but never completes the
          payment. Each checkout is re-checked about 5 minutes after it starts. Turning this on only
          affects checkouts started from that moment on.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setSaved(false) }} />
            Enabled
          </label>

          <div className="inline-flex rounded border p-0.5 text-sm">
            {(['text', 'forward'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`rounded px-3 py-1 ${mode === m ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                onClick={() => { setMode(m); setError(null); setSaved(false) }}
              >
                {m === 'text' ? 'Write a message' : 'Forward from channel'}
              </button>
            ))}
          </div>

          {mode === 'text' ? (
            <>
              <textarea
                className="w-full rounded border p-2"
                rows={4}
                maxLength={MAX_LEN}
                placeholder="Message to send via the bot…"
                value={text}
                onChange={(e) => { setText(e.target.value); setSaved(false) }}
              />
              <div className="text-xs text-gray-500">{text.length}/{MAX_LEN}</div>
              <MessageButtonEditor draft={buttonDraft} onChange={(d) => { setButtonDraft(d); setSaved(false) }} />
            </>
          ) : (
            <div className="space-y-1">
              <input
                className="w-full rounded border p-2"
                placeholder="https://t.me/yourchannel/123"
                value={link}
                onChange={(e) => { setLink(e.target.value); setSaved(false) }}
              />
              <div className="text-xs text-gray-500">
                The bot must be an admin/member of that channel. Users see a “Forwarded from …” header.
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center gap-3">
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              disabled={saving}
              onClick={save}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="text-sm text-green-600">Saved.</span>}
            <span className="text-xs text-gray-500">Sent so far: {sentCount}</span>
          </div>
        </>
      )}
    </div>
  )
}
