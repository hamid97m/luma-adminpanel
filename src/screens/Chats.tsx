import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import type { ChatListItem, Paginated } from '../types'
import Pagination from '../components/Pagination'
import { ListSkeleton } from '../components/Loading'

export default function Chats() {
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter') ?? undefined
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<ChatListItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    api.chats.list(page, filter).then(setData).catch(() => setError('Failed to load chats'))
  }, [page, filter])

  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        {filter === 'fake-unread' ? 'Fake chats — unread' : 'Chats'}
      </h1>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
        {!data && <ListSkeleton rows={7} />}
        {(data?.items ?? []).map((c) => (
          <Link key={c.matchId} to={`/chats/${c.matchId}`} className="flex items-center gap-3 p-3 hover:bg-slate-50">
            <div className="flex -space-x-2">
              {c.users.map((u, i) =>
                u.photo
                  ? <img key={i} src={u.photo} className="w-9 h-9 rounded-full object-cover ring-2 ring-white" />
                  : <div key={i} className="w-9 h-9 rounded-full bg-slate-200 ring-2 ring-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 flex items-center flex-wrap gap-x-1 gap-y-0.5">
                {c.users.map((u, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-slate-400">&</span>}
                    <span>{u.name || '(deleted)'}</span>
                    {u.isSeed && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Fake
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {c.lastMessage ? c.lastMessage.body : 'No messages yet'}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>{c.messageCount} msgs</div>
              <div>{new Date(c.lastMessage?.createdAt ?? c.matchedAt).toLocaleDateString()}</div>
            </div>
          </Link>
        ))}
        {data && data.items.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">No chats yet</p>
        )}
      </div>

      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
