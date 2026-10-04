import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, SupportTicketItem } from '../types'
import Pagination from '../components/Pagination'
import { ListSkeleton } from '../components/Loading'

type Filter = 'open' | 'needs_reply' | 'closed' | 'all'

export default function Support() {
  const [status, setStatus] = useState<Filter>('needs_reply')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<SupportTicketItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.support.list({ status, page })
      .then(setData)
      .catch(() => setError('Failed to load tickets'))
  }, [status, page])

  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Support</h1>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value as Filter); setPage(1) }}
        >
          <option value="needs_reply">Needs reply</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
        {!data && <ListSkeleton rows={7} />}
        {(data?.items ?? []).map((t) => {
          const photo = t.user.photo
            ? <img src={t.user.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
            : <div className="w-10 h-10 rounded-full bg-slate-200" />
          return (
            <div key={t.id} className="relative flex items-center gap-3 p-3 hover:bg-slate-50">
              <Link
                to={`/support/${t.id}`}
                className="absolute inset-0"
                aria-label={`Open ticket from ${t.user.name || 'deleted user'}`}
              />
              {t.user.id ? (
                <Link to={`/users/${t.user.id}`} className="relative z-10 shrink-0" title="Open profile">
                  {photo}
                </Link>
              ) : (
                <div className="relative z-10 shrink-0">{photo}</div>
              )}
              <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
                <div className="text-sm font-medium text-slate-800">
                  {t.user.id ? (
                    <Link
                      to={`/users/${t.user.id}`}
                      className="pointer-events-auto hover:underline"
                      title="Open profile"
                    >
                      {t.user.name || '(deleted)'}
                    </Link>
                  ) : (
                    t.user.name || '(deleted)'
                  )}
                  {t.status === 'closed' && <span className="ml-2 text-xs text-slate-400">closed</span>}
                </div>
                <div className="text-xs text-slate-400 truncate">{t.preview || '(no text)'}</div>
              </div>
              {t.needsReply && (
                <span className="relative z-10 inline-flex items-center px-2 h-6 text-xs font-semibold text-white bg-red-600 rounded-full pointer-events-none">
                  reply
                </span>
              )}
            </div>
          )
        })}
        {data && data.items.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">No tickets.</p>
        )}
      </div>

      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
