import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, TextCheckItem } from '../types'
import { ListSkeleton } from './Loading'
import { textFieldLabel, textReasonLabel, textSourceLabel } from '../utils/textChecks'

const LIMIT = 5

/** A user's latest profile-text AI checks (name / bio / icebreaker), with a link to the full screen. */
export default function UserTextChecksCard({ userId }: { userId: string }) {
  const [data, setData] = useState<Paginated<TextCheckItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError('')
    api.textChecks.list({ verdict: 'all', field: 'all', userId, page: 1 })
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Failed to load text checks') })
    return () => { cancelled = true }
  }, [userId])

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-600">
          Profile text checks{data ? ` (${data.total})` : ''}
        </h2>
        {data && data.total > 0 && (
          <Link to={`/text-checks?userId=${userId}`} className="text-xs text-sky-600 hover:underline">
            View all →
          </Link>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <ListSkeleton rows={3} avatar={false} />}
      {data && data.items.length === 0 && <p className="text-sm text-slate-400">No text checks yet.</p>}
      {data && data.items.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {data.items.slice(0, LIMIT).map((c) => (
            <li key={c.id} className="py-2 flex items-start gap-3 text-sm">
              <div className="w-28 shrink-0">
                <div className="text-xs text-slate-500">{textFieldLabel(c.field)}</div>
                <div className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</div>
              </div>
              <p dir="auto" className="flex-1 min-w-0 text-slate-800 whitespace-pre-wrap break-words">{c.text}</p>
              <div className="shrink-0 text-right">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {c.approved ? 'Approved' : textReasonLabel(c.reason)}
                </span>
                <div className="text-xs text-slate-400">{textSourceLabel(c.source)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
