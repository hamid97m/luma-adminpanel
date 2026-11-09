import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { DeletionReasons } from '../types'
import { ListSkeleton } from './Loading'
import { deletionReasonLabel } from '../utils/deletionReasons'

const DAY_OPTIONS = [7, 30, 90]

const pct = (n: number, total: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '—')

export default function DeletionReasonsCard() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<DeletionReasons | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let current = true
    setData(null)
    setError(false)
    api.deletionReasons(days)
      .then((d) => { if (current) setData(d) })
      .catch(() => { if (current) setError(true) })
    return () => { current = false }
  }, [days])

  const max = Math.max(1, ...(data?.byReason ?? []).map((r) => r.count))

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-slate-600">
          Account deletion reasons
          {data && data.total > 0 && <span className="text-slate-400 font-normal"> · {data.total} deleted</span>}
        </h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Period"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {DAY_OPTIONS.map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">Failed to load deletion reasons</p>}
      {!error && !data && <ListSkeleton rows={4} avatar={false} />}
      {data && data.total === 0 && <p className="py-2 text-sm text-slate-400">No account deletions in this period</p>}

      {data && data.total > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <section className="space-y-3">
            {data.byReason.map((r) => (
              <div key={r.reason ?? ''}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className={r.reason === null ? 'text-slate-500 italic' : 'text-slate-800'}>
                    {deletionReasonLabel(r.reason)}
                  </span>
                  <span className="text-slate-800">
                    {r.count} <span className="text-slate-400">· {pct(r.count, data.total)}</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full mt-1">
                  <div
                    className={`h-2 rounded-full ${r.reason === null ? 'bg-slate-300' : 'bg-rose-500'}`}
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {r.men} men · {r.women} women · {r.premium} premium
                </div>
              </div>
            ))}
          </section>

          <section>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Recent</h3>
            <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {data.recent.map((r) => {
                const who = r.userName || (r.username ? `@${r.username}` : r.telegramId ? `#${r.telegramId}` : 'user')
                return (
                  <li key={r.id} className="py-2 text-sm space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 text-xs">{new Date(r.createdAt).toLocaleString()}</span>
                      <span className={r.reason === null ? 'text-slate-500 italic' : 'text-slate-800 font-medium'}>
                        {deletionReasonLabel(r.reason)}
                      </span>
                      {r.gender && <span className="text-xs text-slate-500">{r.gender}</span>}
                      {r.wasPremium && (
                        <span className="text-xs bg-teal-50 text-teal-700 rounded px-1.5 py-0.5">premium</span>
                      )}
                      {r.daysSinceSignup !== null && (
                        <span className="text-xs text-slate-400">{r.daysSinceSignup}d after signup</span>
                      )}
                      {r.userId && (
                        <Link to={`/users/${r.userId}`} className="text-xs text-sky-600 hover:underline ml-auto">
                          {who}
                        </Link>
                      )}
                    </div>
                    {r.note && <p className="text-slate-600 whitespace-pre-wrap break-words">“{r.note}”</p>}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
