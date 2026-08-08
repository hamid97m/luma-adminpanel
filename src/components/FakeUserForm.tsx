import { ChangeEvent, FormEvent, useState } from 'react'
import { api } from '../api'
import type { UserDetail } from '../types'

export const GENDERS = ['man', 'woman', 'nonbinary']
export const LOOKING = ['men', 'women', 'both', 'everyone']
export const MAX_PHOTOS = 6

export interface FakeForm {
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

export const EMPTY_FORM: FakeForm = {
  name: '', age: '', gender: 'woman', looking_for: 'men',
  bio: '', interests: '', location: '', icebreaker_prompt: '', icebreaker_answer: '',
  photos: [], isActive: true,
}

/** Being edited: the seed user's id plus its full pre-filled form. */
export interface EditingSeed {
  id: string
  form: FakeForm
}

/** Build the editable form from a loaded user detail. */
export function formFromUserDetail(user: UserDetail['user']): FakeForm {
  return {
    name: user.name,
    age: String(user.age),
    gender: user.gender,
    looking_for: user.lookingFor ?? 'men',
    bio: user.bio ?? '',
    interests: (user.interests ?? []).join(', '),
    location: user.location ?? '',
    icebreaker_prompt: user.icebreakerPrompt ?? '',
    icebreaker_answer: user.icebreakerAnswer ?? '',
    photos: user.photos ?? [],
    isActive: user.isActive,
  }
}

export function humanError(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : ''
  if (msg.includes('not_a_seed_user')) return 'This user is not a fake (seed) profile.'
  if (msg.includes('too_many_photos')) return `Too many photos — max ${MAX_PHOTOS}.`
  if (msg.includes('user_not_found')) return 'User not found — it may have been deleted.'
  if (msg.includes('empty_update')) return 'Nothing to save — change at least one field.'
  if (msg.includes('invalid_')) return `${fallback} — check the fields (age 18–99, valid photo URLs)`
  return fallback
}

export default function FakeUserForm({ editing, onDone, onCancel }: {
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
