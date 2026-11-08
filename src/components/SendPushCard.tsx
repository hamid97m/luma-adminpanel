import { useState } from 'react'
import { api } from '../api'

const MAX_TITLE = 100
const MAX_BODY = 500

export default function SendPushCard({ userId }: { userId: string }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  async function send() {
    setResult(null); setSending(true)
    try {
      const r = await api.users.push(userId, { title: title.trim(), body: body.trim() })
      setResult({ ok: r.sent > 0, text: `Sent ${r.sent}, dead ${r.dead}, failed ${r.failed}` })
    } catch (e: any) {
      const code = String(e?.message ?? '')
      const text =
        code.includes('no_push_device') ? 'This user has no device with a push token.'
        : code.includes('push_not_configured') ? 'Push is not configured on the server.'
        : code.includes('standby') ? 'Server is in standby mode — push is disabled.'
        : code.includes('invalid_push') ? `Title (max ${MAX_TITLE}) and body (max ${MAX_BODY}) are required.`
        : code.includes('send_failed') ? 'Send failed — FCM rejected the request.'
        : 'Failed to send push.'
      setResult({ ok: false, text })
    } finally {
      setSending(false)
    }
  }

  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm'
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-medium text-slate-600">Send test push</h2>
      <p className="text-xs text-slate-400">Sends a push notification to all of this user’s devices with a push token.</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={MAX_TITLE} placeholder="Title" className={input} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={MAX_BODY} rows={2} placeholder="Body" className={input} />
      <div className="flex items-center gap-3">
        <button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send push'}
        </button>
        <span className="text-xs text-slate-400">{body.length}/{MAX_BODY}</span>
        {result && <span className={`text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>{result.text}</span>}
      </div>
    </div>
  )
}
