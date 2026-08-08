import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Paginated, UserListItem } from '../types'
import Pagination from '../components/Pagination'

const GENDERS = ['man', 'woman', 'nonbinary']
const LOOKING = ['men', 'women', 'both', 'everyone']
const MAX_PHOTOS = 6

interface FakeForm {
  name: string
  age: string
  gender: string
  looking_for: string
  bio: string
  interests: string
  location: string
  icebreaker_prompt: string
  icebreaker_answer: string
  photos: string[]
  isActive: boolean
}

const EMPTY_FORM: FakeForm = {
  name: '', age: '', gender: 'woman', looking_for: 'men',
  bio: '', interests: '', location: '', icebreaker_prompt: '', icebreaker_answer: '',
  photos: [], isActive: true,
}

/** Being edited: the seed user's id plus its full pre-filled form. */
interface EditingSeed {
  id: string
  form: FakeForm
}

function humanError(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : ''
  if (msg.includes('not_a_seed_user')) return 'This user is not a fake (seed) profile.'
  if (msg.includes('too_many_photos')) return `Too many photos — max ${MAX_PHOTOS}.`
  if (msg.includes('user_not_found')) return 'User not found — it may have been deleted.'
  if (msg.includes('empty_update')) return 'Nothing to save — change at least one field.'
  if (msg.includes('invalid_')) return `${fallback} — check the fields (age 18–99, valid photo URLs)`
  return fallback
}

function statusBadge(u: UserListItem) {
  if (u.deletedAt || u.bannedAt) {
    return <span className="text-xs rounded-full bg-slate-200 text-slate-600 px-2 py-0.5">Deleted</span>
  }
  if (u.isActive) {
    return <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">Active</span>
  }
  return <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">Inactive</span>
}

function FakeUserForm({ editing, onDone, onCancel }: {
  editing: EditingSeed | null
  onDone: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<FakeForm>(editing ? editing.form : EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof FakeForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  function setPhoto(i: number, value: string) {
    setForm({ ...form, photos: form.photos.map((p, idx) => (idx === i ? value : p)) })
  }

  function addPhoto() {
    if (form.photos.length >= MAX_PHOTOS) return
    setForm({ ...form, photos: [...form.photos, ''] })
  }

  function removePhoto(i: number) {
    setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const photos = form.photos.map((p) => p.trim()).filter(Boolean)
    const interests = form.interests.split(',').map((s) => s.trim()).filter(Boolean)
    try {
      if (editing) {
        await api.users.update(editing.id, {
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
          looking_for: form.looking_for,
          bio: form.bio.trim() || null,
          location: form.location.trim() || null,
          interests,
          icebreaker_prompt: form.icebreaker_prompt.trim() || null,
          icebreaker_answer: form.icebreaker_answer.trim() || null,
          is_active: form.isActive,
          photos,
        })
      } else {
        await api.users.create({
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
          looking_for: form.looking_for,
          bio: form.bio.trim() || undefined,
          location: form.location.trim() || undefined,
          icebreaker_prompt: form.icebreaker_prompt.trim() || undefined,
          icebreaker_answer: form.icebreaker_answer.trim() || undefined,
          interests,
          photos,
        })
      }
      onDone()
    } catch (err) {
      setError(humanError(err, editing ? 'Failed to save' : 'Failed to create fake user'))
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 bg-white'

  return (
    <form onSubmit={onSubmit} className="bg-slate-50 rounded-xl p-5 space-y-4 max-w-xl">
      <h3 className="text-sm font-medium text-slate-600">{editing ? 'Edit fake user' : 'New fake user'}</h3>
      <input className={input} placeholder="Name *" value={form.name} onChange={set('name')} />
      <input className={input} placeholder="Age * (18–99)" type="number" min={18} max={99} value={form.age} onChange={set('age')} />
      <div className="flex gap-3">
        <select className={input} value={form.gender} onChange={set('gender')}>
          {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={input} value={form.looking_for} onChange={set('looking_for')}>
          {LOOKING.map((l) => <option key={l} value={l}>looking for {l}</option>)}
        </select>
      </div>
      <textarea className={input} placeholder="Bio" rows={3} value={form.bio} onChange={set('bio')} />
      <input className={input} placeholder="Interests (comma-separated)" value={form.interests} onChange={set('interests')} />
      <input className={input} placeholder="Location" value={form.location} onChange={set('location')} />
      <input className={input} placeholder="Icebreaker prompt" value={form.icebreaker_prompt} onChange={set('icebreaker_prompt')} />
      <input className={input} placeholder="Icebreaker answer" value={form.icebreaker_answer} onChange={set('icebreaker_answer')} />

      <div className="space-y-2">
        <label className="block text-xs text-slate-500">Photos (URLs, max {MAX_PHOTOS})</label>
        {form.photos.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={input}
              type="url"
              placeholder={`Photo URL ${i + 1}`}
              value={p}
              onChange={(e) => setPhoto(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
        {form.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={addPhoto}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600"
          >
            Add photo
          </button>
        )}
      </div>

      {editing && (
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          disabled={busy || !form.name || !form.age}
          className="bg-slate-900 text-white rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Create fake user'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-5 py-2 text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  )
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
      setEditing({
        id: u.id,
        form: {
          name: d.user.name,
          age: String(d.user.age),
          gender: d.user.gender,
          looking_for: d.user.lookingFor ?? 'men',
          bio: d.user.bio ?? '',
          interests: (d.user.interests ?? []).join(', '),
          location: d.user.location ?? '',
          icebreaker_prompt: d.user.icebreakerPrompt ?? '',
          icebreaker_answer: d.user.icebreakerAnswer ?? '',
          photos: d.user.photos ?? [],
          isActive: d.user.isActive,
        },
      })
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
