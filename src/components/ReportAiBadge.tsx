import type { ReportAiResult } from '../types'
import { reportAiCategoryLabel, reportAiVerdictClass, reportAiVerdictLabel } from '../utils/reportAi'

/** Per-report AI review result on the report detail page. */
export default function ReportAiBadge({ ai }: { ai: ReportAiResult }) {
  const category = reportAiCategoryLabel(ai.category)
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-slate-500">AI</span>
        <span className={`inline-block rounded-full px-2 py-0.5 font-medium ${reportAiVerdictClass(ai.verdict)}`}>
          {reportAiVerdictLabel(ai.verdict)}
        </span>
        {category && ai.category !== 'none' && (
          <span className="inline-block rounded-full bg-white border border-slate-200 px-2 py-0.5 text-slate-600">{category}</span>
        )}
        {ai.reporterNotifiedAt && (
          <span className="text-green-700" title={new Date(ai.reporterNotifiedAt).toLocaleString()}>✓ reporter thanked</span>
        )}
        <span className="ml-auto text-slate-400">{new Date(ai.createdAt).toLocaleString()}</span>
      </div>
      {ai.quote && (
        <p dir="auto" className="text-sm text-slate-800 whitespace-pre-wrap break-words border-l-2 border-slate-300 pl-2">
          “{ai.quote}”
        </p>
      )}
      {ai.explanation && <p dir="rtl" className="text-sm text-slate-600 text-right">{ai.explanation}</p>}
    </div>
  )
}
