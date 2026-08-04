import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, UserListItem } from '../types'
import Pagination from '../components/Pagination'

const STATUSES = ['all', 'active', 'banned', 'deleted', 'seed'] as const

function statusBadge(u: UserListItem) {
  if (u.deletedAt) return <span className="text-xs rounded-full bg-slate-200 text-slate-600 px-2 py-0.5">deleted</span>
  if (u.bannedAt) return <span className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-0.5">banned</span>
  if (u.isSeed) return <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">seed</span>
  return <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">active</span>
}

export default function Users() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<UserListItem> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      api.users.list({ query, status, page })
        .then(setData)
        .catch(() => setError('Failed to load users'))
    }, 300)
    return () => clearTimeout(t)
  }, [query, status, page])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Users</h1>

      <div className="flex flex-wrap gap-3">
        <input
          className="border border-slate-300 rounded-lg px-3 py-2 w-72 bg-white"
          placeholder="Search name, username, or telegram id…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
        />
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Telegram ID</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link to={`/users/${u.id}`} className="text-slate-900 font-medium hover:underline">
                    {u.name || '(deleted)'}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-500">{u.username ?? '—'}</td>
                <td className="px-4 py-2 text-slate-500">{u.telegramId}</td>
                <td className="px-4 py-2">{u.age || '—'}</td>
                <td className="px-4 py-2">{u.gender}</td>
                <td className="px-4 py-2">{statusBadge(u)}</td>
                <td className="px-4 py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <p className="text-sm text-slate-500">{data.total} users</p>}
      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
