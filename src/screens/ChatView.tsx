import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { ChatTranscript } from '../types'
import { PageLoader } from '../components/Loading'
import Pagination from '../components/Pagination'

export default function ChatView() {
  const { matchId } = useParams<{ matchId: string }>()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ChatTranscript | null>(null)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  function load() {
    if (!matchId) return
    api.chats.transcript(matchId, page).then(setData).catch(() => setError('Failed to load chat'))
  }

  useEffect(load, [matchId, page])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <PageLoader />

  const [a, b] = data.match.users
  const isFromA = (senderId: string) => (a.id !== null ? senderId === a.id : senderId !== b.id)
  const senderName = (senderId: string) =>
    isFromA(senderId) ? (a.name || '(deleted)') : (b.name || '(deleted)')

  const fake = a.isSeed ? a : b.isSeed ? b : null

  async function onSend() {
    if (!matchId || !draft.trim() || sending) return
    setSending(true)
    setSendError('')
    try {
      await api.chats.sendAsFake(matchId, draft.trim())
      setDraft('')
      // Reload the last page so the new message shows (transcript is ascending).
      const last = data!.messages.pageCount
      if (page !== last) setPage(last)
      else load()
    } catch (e) {
      const err = e as { status?: number; message?: string }
      setSendError(err.status === 400 ? 'Message is empty or too long' : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        {a.name || '(deleted)'} &amp; {b.name || '(deleted)'}
      </h1>
      <p className="text-sm text-slate-500">
        Matched {new Date(data.match.matchedAt).toLocaleString()} ·{' '}
        {a.id && <Link className="underline" to={`/users/${a.id}`}>{a.name}</Link>}
        {a.id && b.id && ' · '}
        {b.id && <Link className="underline" to={`/users/${b.id}`}>{b.name}</Link>}
      </p>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
        {data.messages.items.map((m) => {
          const mine = isFromA(m.senderId)
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-white'}`}>
                <div className="text-[10px] opacity-60 mb-0.5">{senderName(m.senderId)}</div>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  {new Date(m.createdAt).toLocaleString()}{m.readAt ? ' · read' : ''}
                </div>
              </div>
            </div>
          )
        })}
        {data.messages.items.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-4">No messages</p>
        )}
      </div>

      <Pagination page={data.messages.page} pageCount={data.messages.pageCount} onPage={setPage} />

      {fake ? (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
          <div className="text-xs text-slate-500">Reply as <span className="font-medium text-slate-800">{fake.name}</span> (fake user)</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={`Message as ${fake.name}…`}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          {sendError && <p className="text-sm text-red-600">{sendError}</p>}
          <div className="flex justify-end">
            <button
              onClick={onSend}
              disabled={sending || !draft.trim()}
              className="bg-slate-900 text-white rounded-lg px-5 py-2 text-sm disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">This is a chat between two real users — read only.</p>
      )}
    </div>
  )
}
