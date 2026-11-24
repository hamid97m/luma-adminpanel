import type { ReportAiMode, ReportAiVerdict } from '../types'

export const REPORT_AI_MODE_LABELS: Record<ReportAiMode, string> = {
  off: 'Off',
  review: 'Review only',
  auto: 'Auto (ban / suspend)',
}

export const REPORT_AI_VERDICT_LABELS: Record<ReportAiVerdict, string> = {
  ban: 'Banned',
  suspend: 'Suspended',
  would_ban: 'Would ban',
  would_suspend: 'Would suspend',
  not_valid: 'Not valid',
  unverified: 'Unverified quote',
  unclear: 'Unclear',
  skipped: 'Skipped',
  error: 'Error',
}

export const REPORT_AI_CATEGORY_LABELS: Record<string, string> = {
  insult: 'Insult / swearing',
  threat: 'Threat',
  sexual_harassment: 'Sexual harassment',
  scam: 'Scam',
  harassment: 'Harassment',
  spam_ad: 'Spam / ad',
  none: 'None',
}

export const reportAiVerdictLabel = (v: string) => REPORT_AI_VERDICT_LABELS[v as ReportAiVerdict] ?? v
export const reportAiCategoryLabel = (c: string | null) => (c ? REPORT_AI_CATEGORY_LABELS[c] ?? c : null)

/** Badge colours: red = ban, amber = suspend, sky = review-mode "would …", slate = no action. */
export function reportAiVerdictClass(v: string): string {
  switch (v) {
    case 'ban': return 'bg-red-100 text-red-700'
    case 'suspend': return 'bg-amber-100 text-amber-800'
    case 'would_ban':
    case 'would_suspend': return 'bg-sky-100 text-sky-700'
    case 'error': return 'bg-rose-50 text-rose-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export const reportStatusLabel = (s: string) =>
  s === 'resolved_banned' ? 'banned' : s === 'resolved_suspended' ? 'suspended' : s === 'dismissed' ? 'dismissed' : s

export const reportStatusClass = (s: string) =>
  s === 'resolved_banned' ? 'text-red-600' : s === 'resolved_suspended' ? 'text-amber-600' : 'text-slate-400'

/** A suspension counts only while its end is in the future. */
export const isSuspended = (until: string | null | undefined): until is string =>
  !!until && new Date(until).getTime() > Date.now()
