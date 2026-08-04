import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, ReportHistoryItem, ReportSummaryItem } from '../types'
import Pagination from '../components/Pagination'

type ReportStatus = 'pending' | 'resolved'

// The backend returns a different shape per status: grouped summaries for
// 'pending', a flat resolved history for 'resolved'. Narrow on the field
// that's unique to the grouped shape.
function isSummary(item: ReportSummaryItem | ReportHistoryItem): item is ReportSummaryItem {
  return 'reportCount' in item
}

export default function Reports() {
  const [status, setStatus] = useState<ReportStatus>('pending')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<ReportSummaryItem | ReportHistoryItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.reports.list({ status, page })
      .then(setData)
      .catch(() => setError('Failed to load reports'))
  }, [status, page])

  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value as ReportStatus); setPage(1) }}
        >
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
        {(data?.items ?? []).map((r) =>
          isSummary(r) ? (
            <Link
              key={r.reportedUser.id}
              to={`/reports/${r.reportedUser.id}`}
              className="flex items-center gap-3 p-3 hover:bg-slate-50"
            >
              {r.reportedUser.photo
                ? <img src={r.reportedUser.photo} className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full bg-slate-200" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">
                  {r.reportedUser.name || '(deleted)'}
                  {r.reportedUser.bannedAt && <span className="ml-2 text-xs text-red-600">banned</span>}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {r.reasons.join(', ')} · {r.contexts.join(', ')}
                </div>
              </div>
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-semibold text-white bg-red-600 rounded-full">
                {r.reportCount}
              </span>
            </Link>
          ) : (
            <Link
              key={r.id}
              to={`/reports/${r.reportedUser.id}`}
              className="flex items-center gap-3 p-3 hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">
                  {r.reportedUser.name || '(deleted)'}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {r.reason} · {r.context}
                </div>
              </div>
              <span className={`text-xs font-semibold ${r.status === 'resolved_banned' ? 'text-red-600' : 'text-slate-400'}`}>
                {r.status === 'resolved_banned' ? 'banned' : 'dismissed'}
              </span>
            </Link>
          )
        )}
        {data && data.items.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">No {status} reports.</p>
        )}
      </div>

      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
