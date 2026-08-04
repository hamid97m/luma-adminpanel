import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { token } = await api.login(username, password)
      setToken(token)
      navigate('/dashboard')
    } catch {
      setError('Invalid username or password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-slate-800">Luma Admin</h1>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy || !username || !password}
          className="w-full bg-slate-900 text-white rounded-lg py-2 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
