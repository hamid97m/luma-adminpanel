import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, ReportAiCheckItem } from '../types'
import Pagination from '../components/Pagination'
import { Skeleton } from '../components/Loading'
import {
  REPORT_AI_MODE_LABELS, reportAiCategoryLabel, reportAiVerdictClass, reportAiVerdictLabel,
} from '../utils/reportAi'

export default function ReportAiChecks() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<ReportAiCheckItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setData(null)
    api.reportAiChecks.list(page)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Failed to load AI report reviews') })
    return () => { cancelled = true }
  }, [page])

  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Report Reviews</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every new report (except fake-profile reports) is reviewed by DeepSeek against the reported user's own
          chat messages and profile text. In Auto mode clear abuse bans the user and medium violations suspend them;
          other verdicts stay pending for you. Mode and suspension length are set on the Reports page.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 border-b border-slate-100">
            <tr>
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Reported</th>
              <th className="p-3 font-medium">Reporter</th>
              <th className="p-3 font-medium">Verdict</th>
              <th className="p-3 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!data && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}><td colSpan={5} className="p-3"><Skeleton className="h-4 w-2/3" /></td></tr>
            ))}
            {data?.items.map((c) => {
              const category = reportAiCategoryLabel(c.category)
              return (
                <tr key={c.id} className="align-top">
                  <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                    {new Date(c.createdAt).toLocaleString()}
                    <div className="text-slate-400">mode: {REPORT_AI_MODE_LABELS[c.mode] ?? c.mode}</div>
                  </td>
                  <td className="p-3">
                    <Link to={`/reports/${c.reported.id}`} className="font-medium text-slate-800 hover:underline">
                      {c.reported.name || '(deleted)'}
                    </Link>
                    <div><Link to={`/users/${c.reported.id}`} className="text-xs text-slate-400 hover:underline">profile</Link></div>
                  </td>
                  <td className="p-3">
                    <Link to={`/users/${c.reporter.id}`} className="text-slate-700 hover:underline">
                      {c.reporter.name || '(deleted)'}
                    </Link>
                    {c.reporterNotifiedAt && <div className="text-xs text-green-700">✓ thanked</div>}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${reportAiVerdictClass(c.verdict)}`}>
                      {reportAiVerdictLabel(c.verdict)}
                    </span>
                    {category && c.category !== 'none' && <div className="text-xs text-slate-500 mt-1">{category}</div>}
                    {c.skipReason && <div className="text-xs text-slate-400 mt-1">{c.skipReason}</div>}
                  </td>
                  <td className="p-3 min-w-[16rem]">
                    {c.quote && <p dir="auto" className="text-slate-800 whitespace-pre-wrap break-words">“{c.quote}”</p>}
                    {c.explanation && <p dir="rtl" className="text-right text-slate-500 mt-1">{c.explanation}</p>}
                  </td>
                </tr>
              )
            })}
            {data && data.items.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-400">No AI reviews yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
