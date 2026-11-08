import { useEffect, useState } from 'react'
import { api } from '../api'
import { ALL_LOCALES } from '../types'
import type { Broadcast, BroadcastFilters } from '../types'
import { MessageButtonEditor, buildButton, emptyButtonDraft, type ButtonDraft } from '../components/MessageButtonEditor'
import PurchaseMessageCard from '../components/PurchaseMessageCard'

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
const PLATFORMS: { value: 'telegram' | 'web' | 'android'; label: string }[] = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'web', label: 'Web' },
  { value: 'android', label: 'Android' },
]
const MAX_LEN = 4096
const PUSH_MAX_LEN = 500
const PUSH_TITLE_MAX = 100

export default function Broadcasts() {
  const [mode, setMode] = useState<'text' | 'forward'>('text')
  const [channel, setChannel] = useState<'bot' | 'push'>('bot')
  const [title, setTitle] = useState('')
  const [platforms, setPlatforms] = useState<('telegram' | 'web' | 'android')[]>([])
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [genders, setGenders] = useState<string[]>([])
  const [lookingFor, setLookingFor] = useState<string[]>([])
  // User locales ('fa' | 'en' | 'ar'); none checked = all languages.
  const [locales, setLocales] = useState<string[]>([])
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
    if (locales.length) f.locales = locales
    if (activity === 'active7') f.activity = { activeWithinDays: 7 }
    else if (activity === 'active30') f.activity = { activeWithinDays: 30 }
    else if (activity === 'inactive30') f.activity = { inactiveOverDays: 30 }
    if (premium !== 'any') f.premium = premium
    if (platforms.length) f.platforms = platforms
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
        const { count } = await api.broadcasts.preview(buildFilters(), channel)
        if (!cancelled) setPreviewCount(count)
      } catch (e: any) {
        if (!cancelled) {
          setPreviewCount(null)
          // Push off on the server: say so now instead of only after Send.
          const msg = friendlyError(e)
          if (channel === 'push' && /standby|not configured/.test(msg)) setError(msg)
        }
      } finally {
        if (!cancelled) setPreviewing(false)
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genders, lookingFor, locales, activity, premium, platforms, channel])

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
      case 'empty_title': return 'Push title is empty.'
      case 'title_too_long': return `Push title is too long (max ${PUSH_TITLE_MAX}).`
      case 'message_too_long': return `Message is too long (max ${channel === 'push' ? PUSH_MAX_LEN : MAX_LEN}).`
      case 'push_forward_unsupported': return 'Forwarding is not supported for push notifications.'
      case 'invalid_channel': return 'Invalid channel.'
      case 'empty_audience': return 'No users match these filters.'
      case 'standby': return 'Server is in standby mode — push is disabled.'
      case 'push_not_configured': return 'Push is not configured on the server.'
      default: return code || 'Failed to start broadcast.'
    }
  }

  async function onSend() {
    setError(null)
    const trimmedMsg = message.trim()
    const trimmedLink = link.trim()
    const trimmedTitle = title.trim()
    if (channel === 'push' && !trimmedTitle) { setError('Push title is empty.'); return }
    if (mode === 'text' && !trimmedMsg) { setError('Message is empty.'); return }
    if (mode === 'forward' && !trimmedLink) { setError('Paste a channel message link.'); return }

    const what = channel === 'push' ? 'send this push notification to' : mode === 'forward' ? 'forward this channel message to' : 'send this message to'
    if (!window.confirm(`Are you sure you want to ${what} ${previewCount ?? '?'} users?`)) return

    setSending(true)
    try {
      if (mode === 'forward') {
        await api.broadcasts.create({ kind: 'forward', link: trimmedLink, filters: buildFilters() })
        setLink('')
      } else {
        await api.broadcasts.create({
          kind: 'text', channel, message: trimmedMsg, filters: buildFilters(), button: buildButton(buttonDraft),
          ...(channel === 'push' ? { title: trimmedTitle } : {}),
        })
        setMessage('')
        setTitle('')
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
        <div className="space-y-1">
          <div className="text-sm font-medium">Channel</div>
          <div className="inline-flex rounded border p-0.5 text-sm">
            {(['bot', 'push'] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={`rounded px-3 py-1 ${channel === c ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                onClick={() => { setChannel(c); if (c === 'push') setMode('text'); setError(null) }}
              >
                {c === 'bot' ? 'Telegram bot' : 'Push notification'}
              </button>
            ))}
          </div>
          {channel === 'push' && (
            <div className="text-xs text-gray-500">Push reaches Android app users only (devices with a push token).</div>
          )}
        </div>

        <div className="inline-flex rounded border p-0.5 text-sm">
          {(['text', 'forward'] as const).map((m) => {
            const disabled = m === 'forward' && channel === 'push'
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                title={disabled ? 'Forwarding is only available for Telegram bot broadcasts' : undefined}
                className={`rounded px-3 py-1 disabled:opacity-40 ${mode === m ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                onClick={() => { setMode(m); setError(null) }}
              >
                {m === 'text' ? 'Write a message' : 'Forward from channel'}
              </button>
            )
          })}
        </div>
        {channel === 'push' && (
          <div className="text-xs text-gray-500">Forward from channel is not available for push notifications.</div>
        )}

        {channel === 'push' && (
          <input
            className="w-full rounded border p-2"
            maxLength={PUSH_TITLE_MAX}
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}

        {mode === 'text' ? (
          <>
            <textarea
              className="w-full rounded border p-2"
              rows={4}
              maxLength={channel === 'push' ? PUSH_MAX_LEN : MAX_LEN}
              placeholder={channel === 'push' ? 'Notification body…' : 'Message to send via the bot…'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="text-xs text-gray-500">{message.length}/{channel === 'push' ? PUSH_MAX_LEN : MAX_LEN}</div>
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
          <fieldset>
            <legend className="text-sm font-medium">Language</legend>
            {ALL_LOCALES.map((l) => (
              <label key={l.value} className="mr-3 text-sm">
                <input type="checkbox" checked={locales.includes(l.value)} onChange={() => toggle(locales, l.value, setLocales)} /> {l.label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Platform</legend>
            {PLATFORMS.map((p) => (
              <label key={p.value} className="mr-3 text-sm">
                <input type="checkbox" checked={platforms.includes(p.value)} onChange={() => toggle(platforms, p.value, setPlatforms as any)} /> {p.label}
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
          disabled={sending || (mode === 'text' ? !message.trim() || (channel === 'push' && !title.trim()) : !link.trim()) || previewCount === 0}
          onClick={onSend}
        >
          {sending ? 'Starting…' : mode === 'forward' ? 'Forward broadcast' : channel === 'push' ? 'Send push broadcast' : 'Send broadcast'}
        </button>
      </div>

      <PurchaseMessageCard />

      <div className="space-y-2">
        <h2 className="text-lg font-medium">History</h2>
        {history.length === 0 && <div className="text-sm text-gray-500">No broadcasts yet.</div>}
        {history.map((b) => (
          <div key={b.id} className="rounded border p-3 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="font-medium capitalize">{b.status}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${b.channel === 'push' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                  {b.channel === 'push' ? 'Push' : 'Telegram bot'}
                </span>
                {b.kind === 'forward' && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">Forwarded</span>
                )}
              </span>
              <span className="text-gray-500">{new Date(b.createdAt).toLocaleString()}</span>
            </div>
            {b.kind === 'forward' ? (
              <a className="mt-1 block truncate text-blue-600 hover:underline" href={b.message} target="_blank" rel="noreferrer">{b.message}</a>
            ) : (
              <div className="mt-1 text-gray-700 line-clamp-2">{b.channel === 'push' && b.title ? <span className="font-medium">{b.title} — </span> : null}{b.message}</div>
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
