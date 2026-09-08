import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Broadcast, BroadcastFilters } from '../types'
import { MessageButtonEditor, buildButton, emptyButtonDraft, type ButtonDraft } from '../components/MessageButtonEditor'

// Values MUST match the DB `gender_type` enum ('man' | 'woman' | 'nonbinary').
// Sending 'male'/'female' matches zero rows and makes the audience count show 0.
const GENDERS: { value: string; label: string }[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'nonbinary', label: 'Nonbinary' },
]
// The `looking_for` column is its OWN enum ('men' | 'women' | 'both' | 'everyone'),
// NOT the gender enum. Reusing GENDERS here sent 'man'/'woman' and matched zero rows,
// so the audience count dropped to 0 for any "Looking for" selection.
const LOOKING_FOR: { value: string; label: string }[] = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'both', label: 'Both' },
  { value: 'everyone', label: 'Everyone' },
]
const MAX_LEN = 4096

export default function Broadcasts() {
  const [mode, setMode] = useState<'text' | 'forward'>('text')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [genders, setGenders] = useState<string[]>([])
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [activity, setActivity] = useState<'any' | 'active7' | 'active30' | 'inactive30'>('any')
  const [premium, setPremium] = useState<'any' | 'premium' | 'free'>('any')
  const [buttonDraft, setButtonDraft] = useState<ButtonDraft>(emptyButtonDraft)

  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Broadcast[]>([])

  function buildFilters(): BroadcastFilters {
    const f: BroadcastFilters = {}
    if (genders.length) f.genders = genders
    if (lookingFor.length) f.lookingFor = lookingFor
    if (activity === 'active7') f.activity = { activeWithinDays: 7 }
    else if (activity === 'active30') f.activity = { activeWithinDays: 30 }
    else if (activity === 'inactive30') f.activity = { inactiveOverDays: 30 }
    if (premium !== 'any') f.premium = premium
    return f
  }

  async function loadHistory() {
    try { setHistory((await api.broadcasts.list()).items) } catch { /* ignore */ }
  }
  useEffect(() => { loadHistory() }, [])

  // Refresh preview count whenever filters change (debounced).
  useEffect(() => {
    let cancelled = false
    setPreviewing(true)
    const t = setTimeout(async () => {
      try {
        const { count } = await api.broadcasts.preview(buildFilters())
        if (!cancelled) setPreviewCount(count)
      } catch {
        if (!cancelled) setPreviewCount(null)
      } finally {
        if (!cancelled) setPreviewing(false)
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genders, lookingFor, activity, premium])

  // Poll while any broadcast is still running.
  useEffect(() => {
    if (!history.some((b) => b.status === 'running')) return
    const t = setInterval(loadHistory, 3000)
    return () => clearInterval(t)
  }, [history])

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  // The backend returns a JSON body like {"error":"forward_source_unreachable","detail":"…"}.
  // Turn the known codes into readable text; fall back to the raw message.
  function friendlyError(e: any): string {
    const raw = e?.message ?? ''
    let code = raw, detail = ''
    try { const p = JSON.parse(raw); code = p.error ?? raw; detail = p.detail ?? '' } catch { /* not JSON */ }
    switch (code) {
      case 'invalid_link': return 'That doesn’t look like a valid t.me message link.'
      case 'forward_source_unreachable':
        return `The bot can’t forward that message. Make sure it’s an admin/member of the channel.${detail ? ` (${detail})` : ''}`
      case 'empty_audience': return 'No users match these filters.'
      default: return code || 'Failed to start broadcast.'
    }
  }

  async function onSend() {
    setError(null)
    const trimmedMsg = message.trim()
    const trimmedLink = link.trim()
    if (mode === 'text' && !trimmedMsg) { setError('Message is empty.'); return }
    if (mode === 'forward' && !trimmedLink) { setError('Paste a channel message link.'); return }

    const what = mode === 'forward' ? 'forward this channel message to' : 'send this message to'
    if (!window.confirm(`Are you sure you want to ${what} ${previewCount ?? '?'} users?`)) return

    setSending(true)
    try {
      if (mode === 'forward') {
        await api.broadcasts.create({ kind: 'forward', link: trimmedLink, filters: buildFilters() })
        setLink('')
      } else {
        await api.broadcasts.create({ kind: 'text', message: trimmedMsg, filters: buildFilters(), button: buildButton(buttonDraft) })
        setMessage('')
        setButtonDraft(emptyButtonDraft)
      }
      await loadHistory()
    } catch (e: any) {
      setError(friendlyError(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Broadcasts</h1>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="inline-flex rounded border p-0.5 text-sm">
          {(['text', 'forward'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`rounded px-3 py-1 ${mode === m ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
              onClick={() => { setMode(m); setError(null) }}
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="text-xs text-gray-500">{message.length}/{MAX_LEN}</div>
          </>
        ) : (
          <div className="space-y-1">
            <input
              className="w-full rounded border p-2"
              placeholder="https://t.me/yourchannel/123"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <div className="text-xs text-gray-500">
              Paste a link to a channel message (open the message in Telegram → Copy Link). The bot
              must be an admin/member of that channel. Recipients see a “Forwarded from …” header.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <fieldset>
            <legend className="text-sm font-medium">Gender</legend>
            {GENDERS.map((g) => (
              <label key={g.value} className="mr-3 text-sm">
                <input type="checkbox" checked={genders.includes(g.value)} onChange={() => toggle(genders, g.value, setGenders)} /> {g.label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Looking for</legend>
            {LOOKING_FOR.map((g) => (
              <label key={g.value} className="mr-3 text-sm">
                <input type="checkbox" checked={lookingFor.includes(g.value)} onChange={() => toggle(lookingFor, g.value, setLookingFor)} /> {g.label}
              </label>
            ))}
          </fieldset>
          <label className="text-sm">Activity
            <select className="mt-1 block w-full rounded border p-1" value={activity} onChange={(e) => setActivity(e.target.value as any)}>
              <option value="any">Any</option>
              <option value="active7">Active in last 7 days</option>
              <option value="active30">Active in last 30 days</option>
              <option value="inactive30">Inactive over 30 days</option>
            </select>
          </label>
          <label className="text-sm">Premium
            <select className="mt-1 block w-full rounded border p-1" value={premium} onChange={(e) => setPremium(e.target.value as any)}>
              <option value="any">Any</option>
              <option value="premium">Premium only</option>
              <option value="free">Free only</option>
            </select>
          </label>
        </div>

        {mode === 'text' && <MessageButtonEditor draft={buttonDraft} onChange={setButtonDraft} />}

        <div className="text-sm">
          {previewing ? 'Calculating audience…' : `Will send to ${previewCount ?? '?'} users`}
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={sending || (mode === 'text' ? !message.trim() : !link.trim()) || previewCount === 0}
          onClick={onSend}
        >
          {sending ? 'Starting…' : mode === 'forward' ? 'Forward broadcast' : 'Send broadcast'}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">History</h2>
        {history.length === 0 && <div className="text-sm text-gray-500">No broadcasts yet.</div>}
        {history.map((b) => (
          <div key={b.id} className="rounded border p-3 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="font-medium capitalize">{b.status}</span>
                {b.kind === 'forward' && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">Forwarded</span>
                )}
              </span>
              <span className="text-gray-500">{new Date(b.createdAt).toLocaleString()}</span>
            </div>
            {b.kind === 'forward' ? (
              <a className="mt-1 block truncate text-blue-600 hover:underline" href={b.message} target="_blank" rel="noreferrer">{b.message}</a>
            ) : (
              <div className="mt-1 text-gray-700 line-clamp-2">{b.message}</div>
            )}
            <div className="mt-1 text-gray-500">
              {b.sentCount + b.failedCount}/{b.totalRecipients} processed · {b.sentCount} sent · {b.failedCount} failed
              {b.createdByUsername ? ` · by ${b.createdByUsername}` : ''}
            </div>
            {b.status === 'running' && (
              <div className="mt-1 h-1.5 w-full rounded bg-gray-200">
                <div
                  className="h-1.5 rounded bg-blue-600"
                  style={{ width: `${b.totalRecipients ? Math.round(((b.sentCount + b.failedCount) / b.totalRecipients) * 100) : 0}%` }}
                />
              </div>
            )}
            {b.error && <div className="mt-1 text-red-600">{b.error}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
