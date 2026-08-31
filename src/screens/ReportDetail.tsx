import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import type { ReportUserDetail, ChatTranscript } from '../types'
import { PageLoader, Spinner } from '../components/Loading'

function ChatReport({ matchId }: { matchId: string }) {
  const [data, setData] = useState<ChatTranscript | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.chats.transcript(matchId, 1).then(setData).catch(() => setError('Failed to load chat'))
  }, [matchId])
  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return (
    <div className="mt-2 flex items-center gap-2 text-slate-400 text-sm"><Spinner className="w-4 h-4" /> Loading conversation…</div>
  )
  const [a, b] = data.match.users
  const nameOf = (senderId: string) =>
    (a.id !== null ? senderId === a.id : senderId !== b.id) ? (a.name || '(deleted)') : (b.name || '(deleted)')
  return (
    <div className="mt-2 border rounded p-2 max-h-72 overflow-y-auto bg-slate-50 space-y-1">
      {data.messages.items.map((m) => (
        <div key={m.id} className="text-sm"><span className="font-medium">{nameOf(m.senderId)}:</span> {m.body}</div>
      ))}
    </div>
  )
}

export default function ReportDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ReportUserDetail | null>(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!userId) return
    api.reports.userDetail(userId).then(setData).catch(() => setError('Failed to load report'))
  }, [userId])

  async function resolve(action: 'ban' | 'dismiss') {
    if (!userId) return
    setActionError('')
    setBusy(true)
    try {
      await api.reports.resolve(userId, action)
      navigate('/reports')
    } catch {
      setActionError('Action failed')
      setBusy(false)
    }
  }

  async function pauseUser() {
    if (!userId) return
    setActionError('')
    setBusy(true)
    try {
      await api.users.pause(userId)
      navigate('/reports')
    } catch {
      setActionError('Action failed')
      setBusy(false)
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <PageLoader />
  const u = data.reportedUser

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-3">Report: {u.name || '(deleted)'}</h1>

      {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}

      <div className="flex gap-2 flex-wrap mb-3">
        {u.photos.length
          ? u.photos.map((p, i) => <img key={i} src={p} alt="" className="w-28 h-28 rounded object-cover" />)
          : <div className="text-slate-500 text-sm">No photos</div>}
      </div>

      <div className="text-sm text-slate-600 mb-4">
        {u.age ? `${u.age} · ` : ''}{u.gender}{u.bio ? ` · ${u.bio}` : ''}
        {u.bannedAt && <span className="ml-2 text-red-600 font-medium">already banned</span>}
        {u.deletedAt && <span className="ml-2 text-slate-500 font-medium">deleted account</span>}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          disabled={busy || Boolean(u.bannedAt)}
          onClick={() => resolve('ban')}
          className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
        >Ban user</button>
        <button
          disabled={busy || Boolean(u.bannedAt)}
          onClick={pauseUser}
          className="px-4 py-2 rounded bg-amber-600 text-white disabled:opacity-50"
        >Pause – require new photo</button>
        <button
          disabled={busy}
          onClick={() => resolve('dismiss')}
          className="px-4 py-2 rounded border disabled:opacity-50"
        >Dismiss</button>
      </div>

      <h2 className="font-semibold mb-2">Reports ({data.reports.length})</h2>
      <div className="space-y-3">
        {data.reports.map((r) => (
          <div key={r.id} className="border rounded p-3">
            <div className="text-sm">
              <span className="font-medium">{r.reason}</span> · {r.context} · by {r.reporterName || '(deleted)'} ·{' '}
              <span className="text-slate-500">{new Date(r.createdAt).toLocaleString()}</span>
              {r.status !== 'pending' && <span className="ml-2 text-xs text-slate-400">({r.status})</span>}
            </div>
            {r.note && <div className="text-sm text-slate-600 mt-1">"{r.note}"</div>}
            {r.context === 'chat' && r.matchId && <ChatReport matchId={r.matchId} />}
          </div>
        ))}
      </div>
    </div>
  )
}
