import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, PhotoCheckItem, PhotoCheckStats } from '../types'
import StatCard from '../components/StatCard'
import Pagination from '../components/Pagination'
import { Skeleton } from '../components/Loading'

type Verdict = 'all' | 'approved' | 'rejected'

const REASON_LABELS: Record<string, string> = {
  no_face: 'No visible face',
  not_real_person: 'Not a real person',
  celebrity_or_stock: 'Celebrity / stock photo',
  nudity: 'Nudity',
  contact_or_ad: 'Contact info / ad',
}

const reasonLabel = (code: string | null) => (code ? REASON_LABELS[code] ?? code : 'Rejected')

function userStatus(u: PhotoCheckItem['user']): { label: string; className: string } {
  if (u.bannedAt) return { label: 'Banned', className: 'text-red-600' }
  if (u.deletedAt) return { label: 'Deleted', className: 'text-slate-400' }
  if (u.pausedAt) return { label: 'Paused', className: 'text-amber-600' }
  return { label: 'Active', className: 'text-green-600' }
}

function Thumbnail({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div className="aspect-square w-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        No image
      </div>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} onError={() => setFailed(true)} className="aspect-square w-full object-cover" />
    </a>
  )
}

function ReasonsCard({ byReason }: { byReason: Record<string, number> }) {
  const codes = [...new Set([...Object.keys(REASON_LABELS), ...Object.keys(byReason)])]
  const max = Math.max(1, ...codes.map((c) => byReason[c] ?? 0))
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="text-sm font-medium text-slate-600 mb-3">Rejection reasons</h2>
      <ul className="space-y-2">
        {codes.map((code) => {
          const count = byReason[code] ?? 0
          return (
            <li key={code} className="flex items-center gap-3 text-sm">
              <span className="w-48 shrink-0 text-slate-700">{reasonLabel(code)}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-red-500" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="w-10 text-right text-slate-500">{count}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function PhotoChecks() {
  const [stats, setStats] = useState<PhotoCheckStats | null>(null)
  const [verdict, setVerdict] = useState<Verdict>('rejected')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<PhotoCheckItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.photoChecks.stats().then(setStats).catch(() => setError('Failed to load photo checks'))
  }, [])

  useEffect(() => {
    let cancelled = false
    setData(null)
    api.photoChecks.list({ verdict, page })
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Failed to load photo checks') })
    return () => { cancelled = true }
  }, [verdict, page])

  if (error) return <p className="text-red-600">{error}</p>

  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Photo Checks</h1>
        <p className="text-sm text-slate-500 mt-1">
          DeepSeek reviews the main photo of every man after sign-up and whenever his main photo changes.
          Rejected profiles are paused until a new photo is uploaded.
        </p>
      </div>

      {stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Checks" value={stats.total}
              hint={`+${stats.last24h.total} today · +${stats.last7d.total} this week`}
            />
            <StatCard
              label="Approved" value={stats.approved}
              hint={stats.total ? `${pct(stats.approved / stats.total)} approval` : '—'}
            />
            <StatCard label="Rejected" value={stats.rejected} hint={`${stats.last24h.rejected} today`} />
            <StatCard
              label="Spend" value={`$${stats.estimatedCostUsd.toFixed(stats.estimatedCostUsd < 1 ? 3 : 2)}`}
              hint={stats.total
                ? `≈$${((stats.estimatedCostUsd / stats.total) * 1000).toFixed(2)} per 1,000 checks · peak-price estimate`
                : '—'}
            />
          </div>
          <ReasonsCard byReason={stats.byReason} />
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-end">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            value={verdict}
            onChange={(e) => { setVerdict(e.target.value as Verdict); setPage(1) }}
          >
            <option value="all">All</option>
            <option value="rejected">Rejected</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {!data && Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
          {data?.items.map((c) => {
            const status = userStatus(c.user)
            return (
              <div key={c.photoId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <Thumbnail url={c.imageUrl} />
                <div className="p-3 space-y-1">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {c.approved ? 'Approved' : reasonLabel(c.reason)}
                  </span>
                  <Link to={`/users/${c.user.id}`} className="block text-sm font-medium text-slate-800 truncate hover:underline">
                    {c.user.name || '(deleted)'}
                  </Link>
                  <div className={`text-xs ${status.className}`}>{status.label}</div>
                  <div className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
              </div>
            )
          })}
        </div>
        {data && data.items.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-sm text-slate-400">No checks yet.</div>
        )}

        {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
      </div>
    </div>
  )
}
