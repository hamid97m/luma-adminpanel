import { useEffect, useState } from 'react'
import { api } from '../api'
import type { SignupFunnel } from '../types'
import { ListSkeleton } from './Loading'

const DAY_OPTIONS = [1, 7, 30]

// Signup order. The backend's row order isn't relied on; anything not listed
// here (a newer event) sorts after these.
const FUNNEL_ORDER = [
  'app_open', 'auth_ok', 'auth_failed', 'login_view', 'picker_view', 'picker_done',
  'step_view:name', 'step_view:city', 'step_view:age', 'step_view:gender', 'step_view:pref', 'step_view:interests', 'step_view:photo',
  'photo_pick', 'photo_ok', 'photo_failed', 'submit_failed', 'submit_ok', 'page_hidden',
]

const rowKey = (name: string, step: string | null) => (name === 'step_view' && step ? `${name}:${step}` : name)

function rank(key: string): number {
  const i = FUNNEL_ORDER.indexOf(key)
  return i === -1 ? FUNNEL_ORDER.length : i
}

const rowLabel = (name: string, step: string | null) => (step ? `${name} · ${step}` : name)

export default function SignupFunnelCard() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState<SignupFunnel | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let current = true
    setData(null)
    setError(false)
    api.signupFunnel(days)
      .then((d) => { if (current) setData(d) })
      .catch(() => { if (current) setError(true) })
    return () => { current = false }
  }, [days])

  const funnel = [...(data?.funnel ?? [])].sort((a, b) => rank(rowKey(a.name, a.step)) - rank(rowKey(b.name, b.step)))
  const opens = funnel.find((r) => r.name === 'app_open')?.sessions ?? 0
  const pctOfOpens = (n: number) => (opens > 0 ? `${Math.round((n / opens) * 100)}%` : '—')
  const empty = !!data && data.funnel.length === 0 && data.lastStep.length === 0 && data.failures.length === 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-slate-600">Signup funnel</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Period"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {DAY_OPTIONS.map((d) => <option key={d} value={d}>Last {d === 1 ? '24 hours' : `${d} days`}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">Failed to load the signup funnel</p>}
      {!error && !data && <ListSkeleton rows={4} avatar={false} />}
      {empty && <p className="py-2 text-sm text-slate-400">No signup activity in this period yet</p>}

      {data && !empty && (
        <div className="grid md:grid-cols-3 gap-6">
          <section>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Funnel</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 font-medium">Event</th>
                  <th className="py-2 font-medium text-right">Sessions</th>
                  <th className="py-2 font-medium text-right">% of opens</th>
                </tr>
              </thead>
              <tbody>
                {funnel.map((r) => (
                  <tr key={`${r.name}:${r.step ?? ''}`} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-800">{rowLabel(r.name, r.step)}</td>
                    <td className="py-1.5 text-right">{r.sessions}</td>
                    <td className="py-1.5 text-right text-slate-500">{pctOfOpens(r.sessions)}</td>
                  </tr>
                ))}
                {funnel.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-slate-400">No events</td></tr>}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Drop-off: last step reached</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 font-medium">Step</th>
                  <th className="py-2 font-medium text-right">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {data.lastStep.map((r) => (
                  <tr key={r.step ?? ''} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-800">{r.step ?? 'before the first step'}</td>
                    <td className="py-1.5 text-right">{r.sessions}</td>
                  </tr>
                ))}
                {data.lastStep.length === 0 && <tr><td colSpan={2} className="py-3 text-center text-slate-400">No drop-offs</td></tr>}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Failures</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 font-medium">Event</th>
                  <th className="py-2 font-medium">Detail</th>
                  <th className="py-2 font-medium text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.failures.map((r) => (
                  <tr key={`${r.name}:${r.detail ?? ''}`} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-800">{r.name}</td>
                    <td className="py-1.5 font-mono text-xs text-slate-600">{r.detail ?? '—'}</td>
                    <td className="py-1.5 text-right">{r.count}</td>
                  </tr>
                ))}
                {data.failures.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-slate-400">No failures</td></tr>}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  )
}
