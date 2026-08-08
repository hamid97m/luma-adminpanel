import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { FakeLikerConfig, FakeLikerRun, FakeLikerRunStats, FakeLikerStats } from '../types'
import StatCard from '../components/StatCard'
import Pagination from '../components/Pagination'
import { Spinner, TableSkeleton } from '../components/Loading'
import FakeUserForm, { formFromUserDetail, type EditingSeed } from '../components/FakeUserForm'

function ConfigCard({ onSaved }: { onSaved: () => void }) {
  const [enabled, setEnabled] = useState(false)
  const [maxTargetsPerRun, setMaxTargetsPerRun] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.fakeLiker.config()
      .then((cfg: FakeLikerConfig) => {
        setEnabled(cfg.enabled)
        setMaxTargetsPerRun(String(cfg.maxTargetsPerRun))
        setLoaded(true)
      })
      .catch(() => setError('Failed to load config'))
  }, [])

  function onToggle(e: ChangeEvent<HTMLInputElement>) {
    setSaved(false)
    setEnabled(e.target.checked)
  }

  function onMaxChange(e: ChangeEvent<HTMLInputElement>) {
    setSaved(false)
    setMaxTargetsPerRun(e.target.value)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)
    try {
      const cfg = await api.fakeLiker.updateConfig({
        enabled,
        maxTargetsPerRun: Number(maxTargetsPerRun),
      })
      setEnabled(cfg.enabled)
      setMaxTargetsPerRun(String(cfg.maxTargetsPerRun))
      setSaved(true)
      onSaved()
    } catch {
      setError('Failed to save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-600">Bot config</h2>
      {!loaded && !error && <div className="flex items-center gap-2 text-sm text-slate-400"><Spinner className="w-4 h-4" /> Loading…</div>}
      {loaded && (
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={enabled} onChange={onToggle} />
            Bot enabled
          </label>
          <p className="text-xs text-slate-500">
            When ON, the fake liker job can run (manually or on schedule) and swipe on real users using fake women profiles.
          </p>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Max targets per run (1–1000)</label>
            <input
              type="number"
              min={1}
              max={1000}
              step={1}
              value={maxTargetsPerRun}
              onChange={onMaxChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
            />
          </div>
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

function FakeUsersCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-600">Fake users</h2>
      <p className="text-xs text-slate-500">Manage the fake profiles the bot uses.</p>
      <Link
        to="/bot/fakes"
        className="inline-block bg-slate-900 text-white rounded-lg px-5 py-2"
      >
        Manage fake users
      </Link>
    </div>
  )
}

function RunNowCard({ onRan }: { onRan: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<FakeLikerRunStats | null>(null)

  async function onRun() {
    setError('')
    setStats(null)
    setBusy(true)
    try {
      const res = await api.fakeLiker.run()
      setStats(res.stats)
      onRan()
    } catch (e) {
      const err = e as { status?: number }
      if (err.status === 403) {
        setError('Bot is disabled — enable it first')
      } else if (err.status === 409) {
        setError('A run is already in progress')
      } else {
        setError('Failed to run the job')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-600">Run now</h2>
      <button
        onClick={onRun}
        disabled={busy}
        className="bg-slate-900 text-white rounded-lg px-5 py-2 disabled:opacity-50"
      >
        {busy ? 'Running…' : 'Run now'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {stats && !error && (
        <p className="text-sm text-green-600">
          Done — {stats.likesSent} likes sent, {stats.matchesCreated} matches, {stats.salamsSent} salams,{' '}
          {stats.skipped} skipped, {stats.errors} errors.
        </p>
      )}
    </div>
  )
}

function StatsSection({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [stats, setStats] = useState<FakeLikerStats | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<EditingSeed | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    api.fakeLiker.stats()
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
  }, [refreshKey])

  async function onEdit(id: string) {
    setActionError('')
    setEditLoadingId(id)
    try {
      const d = await api.users.detail(id)
      setEditing({ id, form: formFromUserDetail(d.user) })
    } catch {
      setActionError('Failed to load this fake user')
    } finally {
      setEditLoadingId(null)
    }
  }

  function onFormDone() {
    setEditing(null)
    onChanged()
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Fake women" value={stats ? stats.fakeWomenCount : '…'} />
        <StatCard label="Likes sent" value={stats ? stats.totalLikesSent : '…'} />
        <StatCard label="Matches" value={stats ? stats.totalMatchesCreated : '…'} />
        <StatCard label="Salams sent" value={stats ? stats.totalSalamsSent : '…'} />
        <StatCard
          label="Last run"
          value={stats ? (stats.lastRunAt ? new Date(stats.lastRunAt).toLocaleString() : 'Never') : '…'}
        />
        <StatCard
          label="Next run"
          value={stats ? (stats.nextRunAt ? new Date(stats.nextRunAt).toLocaleString() : 'Not scheduled') : '…'}
        />
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      {editing && (
        <FakeUserForm key={editing.id} editing={editing} onDone={onFormDone} onCancel={() => setEditing(null)} />
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Likes sent</th>
              <th className="px-4 py-3">Matches</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats === null && !error && <TableSkeleton rows={5} cols={4} />}
            {stats?.perFake.map((f) => (
              <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link to={`/users/${f.id}`} className="font-medium text-slate-900 hover:underline">
                    {f.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{f.likesSent}</td>
                <td className="px-4 py-2">{f.matches}</td>
                <td className="px-4 py-2">
                  <button
                    className="text-slate-600 hover:underline disabled:opacity-50"
                    disabled={editLoadingId === f.id}
                    onClick={() => onEdit(f.id)}
                  >
                    {editLoadingId === f.id ? 'Loading…' : 'Edit'}
                  </button>
                </td>
              </tr>
            ))}
            {stats && stats.perFake.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No fake women yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RunsHistory({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<FakeLikerRun[] | null>(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    api.fakeLiker.runs(page)
      .then((d) => {
        setItems(d.items)
        setPageCount(d.pageCount)
      })
      .catch(() => setError('Failed to load runs'))
  }, [page, refreshKey])

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-slate-600">Runs history</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Finished</th>
                <th className="px-4 py-3">Likes</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3">Salams</th>
                <th className="px-4 py-3">Errors</th>
              </tr>
            </thead>
            <tbody>
              {items === null && <TableSkeleton rows={5} cols={7} />}
              {items?.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{r.trigger}</td>
                  <td className="px-4 py-2">{new Date(r.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2">{r.likesSent}</td>
                  <td className="px-4 py-2">{r.matchesCreated}</td>
                  <td className="px-4 py-2">{r.salamsSent}</td>
                  <td className="px-4 py-2">{r.errors}</td>
                </tr>
              ))}
              {items && items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No runs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {!error && items && <Pagination page={page} pageCount={pageCount} onPage={setPage} />}
    </div>
  )
}

export default function Bot() {
  const [refreshKey, setRefreshKey] = useState(0)

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Bot</h1>
      <ConfigCard onSaved={refresh} />
      <FakeUsersCard />
      <RunNowCard onRan={refresh} />
      <StatsSection refreshKey={refreshKey} onChanged={refresh} />
      <RunsHistory refreshKey={refreshKey} />
    </div>
  )
}
