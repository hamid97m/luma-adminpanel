import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, UserListItem } from '../types'
import Pagination from '../components/Pagination'
import FakeUserForm, { formFromUserDetail, humanError, type EditingSeed } from '../components/FakeUserForm'

function statusBadge(u: UserListItem) {
  if (u.deletedAt || u.bannedAt) {
    return <span className="text-xs rounded-full bg-slate-200 text-slate-600 px-2 py-0.5">Deleted</span>
  }
  if (u.isActive) {
    return <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">Active</span>
  }
  return <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">Inactive</span>
}

export default function FakeUsers() {
  const [data, setData] = useState<Paginated<UserListItem> | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<EditingSeed | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    api.users.list({ status: 'seed', page })
      .then((d) => { setError(''); setData(d) })
      .catch(() => setError('Failed to load fake users'))
  }, [page, refreshKey])

  function reload() {
    setRefreshKey((k) => k + 1)
  }

  async function onEdit(u: UserListItem) {
    setActionError('')
    setConfirmDeleteId(null)
    setEditLoadingId(u.id)
    try {
      const d = await api.users.detail(u.id)
      setAdding(false)
      setEditing({ id: u.id, form: formFromUserDetail(d.user) })
    } catch {
      setActionError('Failed to load this fake user')
    } finally {
      setEditLoadingId(null)
    }
  }

  async function onDelete(u: UserListItem) {
    if (confirmDeleteId !== u.id) {
      setActionError('')
      setConfirmDeleteId(u.id)
      return
    }
    setConfirmDeleteId(null)
    setActionError('')
    try {
      await api.users.remove(u.id)
      reload()
    } catch (e) {
      setActionError(humanError(e, 'Failed to delete fake user'))
    }
  }

  function onFormDone() {
    setAdding(false)
    setEditing(null)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link to="/bot" className="text-sm text-slate-500 hover:underline">← Back to Bot</Link>
        <h1 className="text-2xl font-semibold text-slate-900">Fake users</h1>
        <p className="text-sm text-slate-500">
          The fake (seed) profiles the bot uses to like and match with real users. Deleting one is a
          soft delete — the profile is removed from the app and the bot pool.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-600">Profiles</h2>
        {!adding && !editing && (
          <button
            onClick={() => { setConfirmDeleteId(null); setAdding(true) }}
            className="bg-slate-900 text-white rounded-lg px-4 py-1.5 text-sm"
          >
            New fake user
          </button>
        )}
      </div>

      {adding && <FakeUserForm key="new" editing={null} onDone={onFormDone} onCancel={() => setAdding(false)} />}
      {editing && (
        <FakeUserForm key={editing.id} editing={editing} onDone={onFormDone} onCancel={() => setEditing(null)} />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {!error && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Looking for</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => {
                const deleted = !!u.deletedAt || !!u.bannedAt
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link to={`/users/${u.id}`} className="text-slate-900 font-medium hover:underline">
                        {u.name || '(deleted)'}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{u.age || '—'}</td>
                    <td className="px-4 py-2">{u.gender}</td>
                    <td className="px-4 py-2">{u.lookingFor ?? '—'}</td>
                    <td className="px-4 py-2">{statusBadge(u)}</td>
                    <td className="px-4 py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      {deleted ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            className="text-slate-600 hover:underline disabled:opacity-50"
                            disabled={editLoadingId === u.id}
                            onClick={() => onEdit(u)}
                          >
                            {editLoadingId === u.id ? 'Loading…' : 'Edit'}
                          </button>
                          <button
                            className={confirmDeleteId === u.id ? 'text-red-700 font-medium hover:underline' : 'text-red-600 hover:underline'}
                            onClick={() => onDelete(u)}
                          >
                            {confirmDeleteId === u.id ? 'Confirm delete?' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {data && data.items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No fake users yet</td></tr>
              )}
            </tbody>
          </table>
          {data === null && <p className="p-6 text-center text-sm text-slate-400">Loading…</p>}
        </div>
      )}

      {data && <p className="text-sm text-slate-500">{data.total} fake users</p>}
      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
