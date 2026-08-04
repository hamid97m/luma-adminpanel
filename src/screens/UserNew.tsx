import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const GENDERS = ['man', 'woman', 'nonbinary']
const LOOKING = ['men', 'women', 'both', 'everyone']

export default function UserNew() {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'woman', looking_for: 'men',
    bio: '', interests: '', location: '', icebreaker_prompt: '', icebreaker_answer: '', photos: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { id } = await api.users.create({
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        looking_for: form.looking_for,
        bio: form.bio || undefined,
        location: form.location || undefined,
        icebreaker_prompt: form.icebreaker_prompt || undefined,
        icebreaker_answer: form.icebreaker_answer || undefined,
        interests: form.interests ? form.interests.split(',').map((s) => s.trim()).filter(Boolean) : [],
        photos: form.photos ? form.photos.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      })
      navigate(`/users/${id}`)
    } catch {
      setError('Failed to create user — check the fields (age 18–99, valid photo URLs)')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 bg-white'

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">New seed profile</h1>
      <p className="text-sm text-slate-500">
        Creates a profile that appears in the discovery deck. It is not linked to a real Telegram account.
      </p>
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <input className={input} placeholder="Name *" value={form.name} onChange={set('name')} />
        <input className={input} placeholder="Age * (18–99)" type="number" value={form.age} onChange={set('age')} />
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
        <textarea className={input} placeholder="Photo URLs (one per line, max 6)" rows={3} value={form.photos} onChange={set('photos')} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy || !form.name || !form.age}
          className="bg-slate-900 text-white rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create profile'}
        </button>
      </form>
    </div>
  )
}
