import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { ReferralConfig, ReferralStats } from '../types'
import StatCard from '../components/StatCard'
import { Spinner, TableSkeleton } from '../components/Loading'

function ToggleCard() {
  const [enabled, setEnabled] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.referrals.config()
      .then((cfg: ReferralConfig) => {
        setEnabled(cfg.enabled)
        setLoaded(true)
      })
      .catch(() => setError('Failed to load config'))
  }, [])

  function onToggle(e: ChangeEvent<HTMLInputElement>) {
    setSaved(false)
    setEnabled(e.target.checked)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)
    try {
      const cfg = await api.referrals.updateConfig({ enabled })
      setEnabled(cfg.enabled)
      setSaved(true)
    } catch {
      setError('Failed to save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-600">Referral program</h2>
      {!loaded && !error && <div className="flex items-center gap-2 text-sm text-slate-400"><Spinner className="w-4 h-4" /> Loading…</div>}
      {loaded && (
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={enabled} onChange={onToggle} />
            Referral program enabled
          </label>
          <p className="text-xs text-slate-500">
            Show the invite-friends feature in the app. Links that were already shared keep attributing signups while this is off; milestone rewards are granted when it's back on.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && !error && <p className="text-sm text-green-600">Saved.</p>}
          <button
            disabled={busy}
            className="bg-slate-900 text-white rounded-lg px-5 py-2 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  )
}

function StatsSection() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.referrals.stats()
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
  }, [])

  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total referrals" value={stats ? stats.total : '—'} />
        <StatCard label="Qualified" value={stats ? stats.qualified : '—'} />
        <StatCard label="Rewards granted" value={stats ? stats.rewardsGranted : '—'} />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Qualified</th>
            </tr>
          </thead>
          <tbody>
            {stats === null && <TableSkeleton rows={4} cols={2} />}
            {stats?.topReferrers.map((r) => (
              <tr key={r.userId} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">
                  <Link to={`/users/${r.userId}`} className="hover:underline">{r.name}</Link>
                </td>
                <td className="px-4 py-2">{r.qualifiedCount}</td>
              </tr>
            ))}
            {stats && stats.topReferrers.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">No referrers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Referrals() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Referrals</h1>
      <ToggleCard />
      <StatsSection />
    </div>
  )
}
