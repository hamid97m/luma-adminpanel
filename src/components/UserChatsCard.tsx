import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { ChatListItem, Paginated } from '../types'
import Pagination from './Pagination'
import { ListSkeleton } from './Loading'

/** One user's chats (default: only those they sent a message in), paginated; a row opens the chat. */
export default function UserChatsCard({ userId }: { userId: string }) {
  const [sentOnly, setSentOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<ChatListItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError('')
    api.chats.forUser(userId, page, sentOnly)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Failed to load chats') })
    return () => { cancelled = true }
  }, [userId, page, sentOnly])

  const toggle = (value: boolean) => { setSentOnly(value); setPage(1) }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-600">
          Chats{data ? ` (${data.total})` : ''}
        </h2>
        <div className="flex rounded-lg border border-slate-300 text-xs overflow-hidden">
          {([[true, 'Sent'], [false, 'All']] as const).map(([value, label]) => (
            <button
              key={label}
              onClick={() => toggle(value)}
              className={sentOnly === value ? 'bg-slate-800 text-white px-3 py-1' : 'bg-white text-slate-600 px-3 py-1'}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <ListSkeleton rows={4} />}
      {data && (
        <ul className="divide-y divide-slate-100">
          {data.items.map((c) => {
            const other = c.users.find((u) => u.id !== userId) ?? c.users[0]
            return (
              <li key={c.matchId}>
                <Link to={`/chats/${c.matchId}`} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-slate-50">
                  {other.photo
                    ? <img src={other.photo} className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full bg-slate-200" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800 flex items-center gap-1">
                      <span>{other.name || '(deleted)'}</span>
                      {other.isSeed && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Fake
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {c.lastMessage ? c.lastMessage.body : 'No messages yet'}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                    <div>{c.sentCount ?? 0} sent / {c.messageCount} msgs</div>
                    <div>{new Date(c.lastMessage?.createdAt ?? c.matchedAt).toLocaleDateString()}</div>
                  </div>
                </Link>
              </li>
            )
          })}
          {data.items.length === 0 && (
            <li className="py-2 text-sm text-slate-400">{sentOnly ? 'No sent chats yet' : 'No chats yet'}</li>
          )}
        </ul>
      )}
      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
