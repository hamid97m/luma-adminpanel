import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Broadcast, BroadcastFilters } from '../types'

const GENDERS = ['male', 'female']
const MAX_LEN = 4096

export default function Broadcasts() {
  const [message, setMessage] = useState('')
  const [genders, setGenders] = useState<string[]>([])
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [activity, setActivity] = useState<'any' | 'active7' | 'active30' | 'inactive30'>('any')
  const [premium, setPremium] = useState<'any' | 'premium' | 'free'>('any')

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

  async function onSend() {
    setError(null)
    const trimmed = message.trim()
    if (!trimmed) { setError('Message is empty.'); return }
    if (!window.confirm(`Send this message to ${previewCount ?? '?'} users?`)) return
    setSending(true)
    try {
      await api.broadcasts.create(trimmed, buildFilters())
      setMessage('')
      await loadHistory()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start broadcast.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Broadcasts</h1>

      <div className="rounded-lg border p-4 space-y-4">
        <textarea
          className="w-full rounded border p-2"
          rows={4}
          maxLength={MAX_LEN}
          placeholder="Message to send via the bot…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="text-xs text-gray-500">{message.length}/{MAX_LEN}</div>

        <div className="grid grid-cols-2 gap-4">
          <fieldset>
            <legend className="text-sm font-medium">Gender</legend>
            {GENDERS.map((g) => (
              <label key={g} className="mr-3 text-sm">
                <input type="checkbox" checked={genders.includes(g)} onChange={() => toggle(genders, g, setGenders)} /> {g}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Looking for</legend>
            {GENDERS.map((g) => (
              <label key={g} className="mr-3 text-sm">
                <input type="checkbox" checked={lookingFor.includes(g)} onChange={() => toggle(lookingFor, g, setLookingFor)} /> {g}
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

        <div className="text-sm">
          {previewing ? 'Calculating audience…' : `Will send to ${previewCount ?? '?'} users`}
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={sending || !message.trim() || previewCount === 0}
          onClick={onSend}
        >
          {sending ? 'Starting…' : 'Send broadcast'}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">History</h2>
        {history.length === 0 && <div className="text-sm text-gray-500">No broadcasts yet.</div>}
        {history.map((b) => (
          <div key={b.id} className="rounded border p-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium capitalize">{b.status}</span>
              <span className="text-gray-500">{new Date(b.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-gray-700 line-clamp-2">{b.message}</div>
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
