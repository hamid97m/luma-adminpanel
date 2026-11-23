import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, TextCheckField, TextCheckItem, TextCheckStats } from '../types'
import StatCard from '../components/StatCard'
import Pagination from '../components/Pagination'
import { Skeleton } from '../components/Loading'
import {
  TEXT_FIELD_LABELS, TEXT_REASON_LABELS, textFieldLabel, textReasonLabel, textSourceLabel,
} from '../utils/textChecks'

type Verdict = 'all' | 'approved' | 'rejected'
type FieldFilter = 'all' | TextCheckField

const VERDICTS: Verdict[] = ['all', 'approved', 'rejected']
const FIELDS: FieldFilter[] = ['all', 'name', 'bio', 'icebreaker_answer']

function userStatus(u: TextCheckItem['user']): { label: string; className: string } | null {
  if (u.bannedAt) return { label: 'Banned', className: 'text-red-600' }
  if (u.deletedAt) return { label: 'Deleted', className: 'text-slate-400' }
  return null
}

function BreakdownCard({ title, counts, labels, color }: {
  title: string
  counts: Record<string, number>
  labels: Record<string, string>
  color: string
}) {
  const codes = [...new Set([...Object.keys(labels), ...Object.keys(counts)])]
  const max = Math.max(1, ...codes.map((c) => counts[c] ?? 0))
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="text-sm font-medium text-slate-600 mb-3">{title}</h2>
      <ul className="space-y-2">
        {codes.map((code) => {
          const count = counts[code] ?? 0
          return (
            <li key={code} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 text-slate-700">{labels[code] ?? code}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="w-10 text-right text-slate-500">{count}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function TextChecks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = searchParams.get('userId') ?? ''
  const [stats, setStats] = useState<TextCheckStats | null>(null)
  const [verdict, setVerdict] = useState<Verdict>(() => {
    const v = searchParams.get('verdict') as Verdict | null
    return v && VERDICTS.includes(v) ? v : userId ? 'all' : 'rejected'
  })
  const [field, setField] = useState<FieldFilter>(() => {
    const f = searchParams.get('field') as FieldFilter | null
    return f && FIELDS.includes(f) ? f : 'all'
  })
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<TextCheckItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.textChecks.stats().then(setStats).catch(() => setError('Failed to load text checks'))
  }, [])

  useEffect(() => {
    let cancelled = false
    setData(null)
    api.textChecks.list({ verdict, field, userId: userId || undefined, page })
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Failed to load text checks') })
    return () => { cancelled = true }
  }, [verdict, field, userId, page])

  if (error) return <p className="text-red-600">{error}</p>

  const pct = (n: number) => `${Math.round(n * 100)}%`
  const clearUser = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('userId')
    setSearchParams(next)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Text Checks</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every changed name, bio and icebreaker answer is checked (regex pre-check, then DeepSeek) when a user saves
          their profile. Rejected text is not saved — the user is told what to fix.
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
            <StatCard
              label="Rejected" value={stats.rejected}
              hint={`${stats.last24h.rejected} today · ${stats.last7d.rejected} this week`}
            />
            <StatCard
              label="Spend" value={`$${stats.estimatedCostUsd.toFixed(stats.estimatedCostUsd < 1 ? 3 : 2)}`}
              hint={stats.total
                ? `≈$${((stats.estimatedCostUsd / stats.total) * 1000).toFixed(2)} per 1,000 checks · ${(stats.promptTokens + stats.completionTokens).toLocaleString()} tokens`
                : '—'}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <BreakdownCard title="Rejection reasons" counts={stats.byReason} labels={TEXT_REASON_LABELS} color="bg-red-500" />
            <BreakdownCard title="Checks by field" counts={stats.byField} labels={TEXT_FIELD_LABELS} color="bg-sky-500" />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {userId && (
            <span className="mr-auto inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700">
              Filtered to one user
              {data?.items[0] && (
                <Link to={`/users/${userId}`} className="font-medium hover:underline">
                  {data.items[0].user.name || '(deleted)'}
                </Link>
              )}
              <button onClick={clearUser} className="text-slate-500 hover:text-slate-900" aria-label="Clear user filter">✕</button>
            </span>
          )}
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            value={field}
            onChange={(e) => { setField(e.target.value as FieldFilter); setPage(1) }}
          >
            <option value="all">All fields</option>
            <option value="name">Name</option>
            <option value="bio">Bio</option>
            <option value="icebreaker_answer">Icebreaker answer</option>
          </select>
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

        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {!data && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
          {data?.items.map((c) => {
            const status = userStatus(c.user)
            return (
              <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                <div className="md:w-48 shrink-0 space-y-0.5">
                  <Link to={`/users/${c.user.id}`} className="block text-sm font-medium text-slate-800 truncate hover:underline">
                    {c.user.name || '(deleted)'}
                  </Link>
                  {status && <div className={`text-xs ${status.className}`}>{status.label}</div>}
                  <div className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-xs text-slate-400">{textFieldLabel(c.field)}</div>
                  <p dir="auto" className="text-sm text-slate-800 whitespace-pre-wrap break-words">{c.text}</p>
                </div>
                <div className="md:w-44 shrink-0 flex md:flex-col md:items-end gap-2 md:gap-1">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {c.approved ? 'Approved' : textReasonLabel(c.reason)}
                  </span>
                  <span className="text-xs text-slate-500">via {textSourceLabel(c.source)}</span>
                </div>
              </div>
            )
          })}
          {data && data.items.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">No checks yet.</div>
          )}
        </div>

        {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
      </div>
    </div>
  )
}
