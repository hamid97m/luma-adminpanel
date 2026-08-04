import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import type { SupportTicketDetail } from '../types'

export default function SupportDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<SupportTicketDetail | null>(null)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  function load() {
    if (!id) return
    api.support.detail(id).then(setData).catch(() => setError('Failed to load ticket'))
  }
  useEffect(load, [id])

  async function send() {
    if (!id || !reply.trim()) return
    setActionError(''); setBusy(true)
    try {
      await api.support.reply(id, reply.trim())
      setReply('')
      load()
    } catch {
      setActionError('Reply failed')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(action: 'close' | 'reopen') {
    if (!id) return
    setActionError(''); setBusy(true)
    try {
      await (action === 'close' ? api.support.close(id) : api.support.reopen(id))
      load()
    } catch {
      setActionError('Action failed')
    } finally {
      setBusy(false)
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-slate-500">Loading…</p>
  const { ticket, messages } = data

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">
          {ticket.user.name || '(deleted)'}
          <span className={`ml-2 text-xs ${ticket.status === 'open' ? 'text-green-600' : 'text-slate-400'}`}>
            {ticket.status}
          </span>
        </h1>
        <button
          disabled={busy}
          onClick={() => toggle(ticket.status === 'open' ? 'close' : 'reopen')}
          className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
        >
          {ticket.status === 'open' ? 'Close' : 'Reopen'}
        </button>
      </div>

      {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}

      <div className="border rounded p-3 max-h-96 overflow-y-auto bg-slate-50 space-y-2 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800'
            }`}>
              <div className="whitespace-pre-wrap break-words">{m.body}</div>
              <div className={`text-[10px] mt-1 ${m.sender === 'admin' ? 'text-blue-100' : 'text-slate-400'}`}>
                {new Date(m.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Write a reply…"
          className="flex-1 rounded-lg border border-slate-300 p-2 text-sm"
        />
        <button
          disabled={busy || !reply.trim()}
          onClick={send}
          className="px-4 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
