import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { UserDetail as UserDetailType } from '../types'

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value ?? '—'}</div>
    </div>
  )
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<UserDetailType | null>(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    api.users.detail(id).then(setData).catch(() => setError('Failed to load user'))
  }, [id])

  useEffect(load, [load])

  async function toggleBan() {
    if (!data || !id) return
    const banned = Boolean(data.user.bannedAt)
    const verb = banned ? 'Unban' : 'Ban'
    if (!window.confirm(`${verb} ${data.user.name}?`)) return
    setActionError('')
    setBusy(true)
    try {
      await (banned ? api.users.unban(id) : api.users.ban(id))
      load()
    } catch {
      setActionError(`${verb} failed`)
    } finally {
      setBusy(false)
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-slate-500">Loading…</p>

  const { user, counts, matches } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {user.name || '(deleted)'}{' '}
          {user.bannedAt && <span className="text-sm text-red-600 font-normal">· banned</span>}
          {user.isSeed && <span className="text-sm text-amber-600 font-normal">· seed</span>}
          {user.deletedAt && <span className="text-sm text-slate-500 font-normal">· deleted</span>}
        </h1>
        <button
          onClick={toggleBan}
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${user.bannedAt ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          {user.bannedAt ? 'Unban' : 'Ban'}
        </button>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {user.photos.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {user.photos.map((url) => (
            <img key={url} src={url} className="w-28 h-28 rounded-xl object-cover" />
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Telegram ID" value={user.telegramId} />
        <Field label="Username" value={user.username} />
        <Field label="Age" value={user.age || null} />
        <Field label="Gender" value={user.gender} />
        <Field label="Looking for" value={user.lookingFor} />
        <Field label="Location" value={user.location} />
        <Field label="Joined" value={new Date(user.createdAt).toLocaleString()} />
        <Field label="Last active" value={new Date(user.lastActive).toLocaleString()} />
        <Field label="Bio" value={user.bio} />
        <Field label="Interests" value={user.interests.join(', ') || null} />
        <Field label="Icebreaker" value={user.icebreakerPrompt ? `${user.icebreakerPrompt} — ${user.icebreakerAnswer ?? ''}` : null} />
        <Field label="Bot PMs allowed" value={user.allowsWriteToPm === null ? '—' : String(user.allowsWriteToPm)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.swipesGiven}</div>
          <div className="text-xs text-slate-500">swipes given</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.likesReceived}</div>
          <div className="text-xs text-slate-500">likes received</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.matches}</div>
          <div className="text-xs text-slate-500">matches</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.messagesSent}</div>
          <div className="text-xs text-slate-500">messages sent</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-medium text-slate-600 mb-2">Matches</h2>
        <ul className="divide-y divide-slate-100">
          {matches.map((m) => (
            <li key={m.matchId}>
              <Link to={`/chats/${m.matchId}`} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-slate-50">
                {m.user.photo
                  ? <img src={m.user.photo} className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-slate-200" />}
                <span className="text-sm text-slate-800 flex-1">{m.user.name || '(deleted)'}</span>
                <span className="text-xs text-slate-400">{new Date(m.matchedAt).toLocaleDateString()}</span>
              </Link>
            </li>
          ))}
          {matches.length === 0 && <li className="py-2 text-sm text-slate-400">No matches yet</li>}
        </ul>
      </div>
    </div>
  )
}
