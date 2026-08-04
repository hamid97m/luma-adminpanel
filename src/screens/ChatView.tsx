import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { ChatTranscript } from '../types'
import Pagination from '../components/Pagination'

export default function ChatView() {
  const { matchId } = useParams<{ matchId: string }>()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ChatTranscript | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!matchId) return
    api.chats.transcript(matchId, page).then(setData).catch(() => setError('Failed to load chat'))
  }, [matchId, page])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-slate-500">Loading…</p>

  const [a, b] = data.match.users
  const senderName = (senderId: string) =>
    senderId === a.id ? a.name : senderId === b.id ? b.name : '?'

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        {a.name || '(deleted)'} &amp; {b.name || '(deleted)'}
      </h1>
      <p className="text-sm text-slate-500">
        Matched {new Date(data.match.matchedAt).toLocaleString()} ·{' '}
        {a.id && <Link className="underline" to={`/users/${a.id}`}>{a.name}</Link>}
        {a.id && b.id && ' · '}
        {b.id && <Link className="underline" to={`/users/${b.id}`}>{b.name}</Link>}
      </p>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
        {data.messages.items.map((m) => {
          const mine = m.senderId === a.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-white'}`}>
                <div className="text-[10px] opacity-60 mb-0.5">{senderName(m.senderId)}</div>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  {new Date(m.createdAt).toLocaleString()}{m.readAt ? ' · read' : ''}
                </div>
              </div>
            </div>
          )
        })}
        {data.messages.items.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-4">No messages</p>
        )}
      </div>

      <Pagination page={data.messages.page} pageCount={data.messages.pageCount} onPage={setPage} />
    </div>
  )
}
