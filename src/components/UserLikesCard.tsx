import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, UserLikeItem } from '../types'
import Pagination from './Pagination'
import { ListSkeleton } from './Loading'
import { timeAgo } from '../utils/timeAgo'

type Dir = 'sent' | 'received'

/** Likes the user sent (default) or received, paginated; a row opens the other profile, "Match" opens the chat. */
export default function UserLikesCard({ userId }: { userId: string }) {
  const [dir, setDir] = useState<Dir>('sent')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<UserLikeItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError('')
    api.users.likes(userId, dir, page)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Failed to load likes') })
    return () => { cancelled = true }
  }, [userId, dir, page])

  const toggle = (value: Dir) => { setDir(value); setPage(1) }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-600">
          Likes{data ? ` (${data.total})` : ''}
        </h2>
        <div className="flex rounded-lg border border-slate-300 text-xs overflow-hidden">
          {([['sent', 'Sent'], ['received', 'Received']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggle(value)}
              className={dir === value ? 'bg-slate-800 text-white px-3 py-1' : 'bg-white text-slate-600 px-3 py-1'}
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
          {data.items.map((l) => (
            <li key={l.user.id} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-slate-50">
              <Link to={`/users/${l.user.id}`} className="flex flex-1 min-w-0 items-center gap-3">
                {l.user.photo
                  ? <img src={l.user.photo} className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-slate-200" />}
                <span className="text-sm text-slate-800 flex items-center gap-1 min-w-0">
                  <span className="truncate">{l.user.name || '(deleted)'}</span>
                  {l.user.isSeed && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Fake
                    </span>
                  )}
                </span>
              </Link>
              {l.matchId && (
                <Link
                  to={`/chats/${l.matchId}`}
                  className="rounded bg-rose-100 px-1.5 py-0.5 text-xs font-medium text-rose-700 hover:bg-rose-200"
                >
                  Match · chat
                </Link>
              )}
              <span className="text-xs text-slate-400 whitespace-nowrap" title={new Date(l.likedAt).toLocaleString()}>
                {timeAgo(l.likedAt)}
              </span>
            </li>
          ))}
          {data.items.length === 0 && (
            <li className="py-2 text-sm text-slate-400">{dir === 'sent' ? 'No likes sent yet' : 'No likes received yet'}</li>
          )}
        </ul>
      )}
      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
