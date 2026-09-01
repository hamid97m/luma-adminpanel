import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { UserDetail as UserDetailType } from '../types'
import { PageLoader } from '../components/Loading'
import { MessageButtonEditor, buildButton, emptyButtonDraft, type ButtonDraft } from '../components/MessageButtonEditor'

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value ?? '—'}</div>
    </div>
  )
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<UserDetailType | null>(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [grantDays, setGrantDays] = useState('30')
  const [msgText, setMsgText] = useState('')
  const [msgButton, setMsgButton] = useState<ButtonDraft>(emptyButtonDraft)
  const [sending, setSending] = useState(false)
  const [msgResult, setMsgResult] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(() => {
    if (!id) return
    api.users.detail(id).then(setData).catch(() => setError('Failed to load user'))
  }, [id])

  useEffect(load, [load])

  async function toggleBan() {
    if (!data || !id) return
    const banned = Boolean(data.user.bannedAt)
    const verb = banned ? 'Unban' : 'Ban'
    if (!window.confirm(`${verb} ${data.user.name}?`)) return
    setActionError('')
    setBusy(true)
    try {
      await (banned ? api.users.unban(id) : api.users.ban(id))
      load()
    } catch {
      setActionError(`${verb} failed`)
    } finally {
      setBusy(false)
    }
  }

  async function togglePause() {
    if (!data || !id) return
    const paused = Boolean(data.user.pausedAt)
    const verb = paused ? 'Resume' : 'Pause'
    if (!window.confirm(`${verb} ${data.user.name}?`)) return
    setActionError('')
    setBusy(true)
    try {
      await (paused ? api.users.unpause(id) : api.users.pause(id))
      load()
    } catch {
      setActionError(`${verb} failed`)
    } finally {
      setBusy(false)
    }
  }

  async function grant() {
    if (!id) return
    const days = Number(grantDays)
    if (!Number.isInteger(days) || days < 1) return
    setActionError(''); setBusy(true)
    try { await api.users.grantPremium(id, days); load() }
    catch { setActionError('Grant failed') }
    finally { setBusy(false) }
  }

  async function revoke() {
    if (!id || !window.confirm(`Revoke premium for ${data?.user.name}?`)) return
    setActionError(''); setBusy(true)
    try { await api.users.revokePremium(id); load() }
    catch { setActionError('Revoke failed') }
    finally { setBusy(false) }
  }

  async function sendMessage() {
    if (!id) return
    const text = msgText.trim()
    if (!text) return
    setMsgResult(null); setSending(true)
    try {
      await api.users.sendMessage(id, text, buildButton(msgButton))
      setMsgText('')
      setMsgButton(emptyButtonDraft)
      setMsgResult({ ok: true, text: 'Message sent.' })
    } catch (e: any) {
      const code = String(e?.message ?? '')
      const friendly =
        code.includes('user_blocked_bot') ? 'User has blocked the bot — message not delivered.'
        : code.includes('not_messageable') ? "This user can't receive bot messages."
        : code.includes('message_too_long') ? 'Message is too long (max 4096 characters).'
        : 'Failed to send message.'
      setMsgResult({ ok: false, text: friendly })
    } finally {
      setSending(false)
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <PageLoader />

  const { user, counts, matches } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {user.name || '(deleted)'}{' '}
          {user.bannedAt && <span className="text-sm text-red-600 font-normal">· banned</span>}
          {user.pausedAt && <span className="text-sm text-amber-600 font-normal">· paused (photo)</span>}
          {user.isSeed && <span className="text-sm text-amber-600 font-normal">· seed</span>}
          {user.deletedAt && <span className="text-sm text-slate-500 font-normal">· deleted</span>}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={togglePause}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${user.pausedAt ? 'bg-emerald-600' : 'bg-amber-600'}`}
          >
            {user.pausedAt ? 'Resume' : 'Pause (new photo)'}
          </button>
          <button
            onClick={toggleBan}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${user.bannedAt ? 'bg-emerald-600' : 'bg-red-600'}`}
          >
            {user.bannedAt ? 'Unban' : 'Ban'}
          </button>
        </div>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {user.photos.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {user.photos.map((url) => (
            <img key={url} src={url} className="w-28 h-28 rounded-xl object-cover" />
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Telegram ID" value={user.telegramId} />
        <Field label="Username" value={user.username} />
        <Field label="Age" value={user.age || null} />
        <Field label="Gender" value={user.gender} />
        <Field label="Looking for" value={user.lookingFor} />
        <Field label="Location" value={user.location} />
        <Field label="Joined" value={new Date(user.createdAt).toLocaleString()} />
        <Field label="Last active" value={new Date(user.lastActive).toLocaleString()} />
        <Field label="Bio" value={user.bio} />
        <Field label="Interests" value={user.interests.join(', ') || null} />
        <Field label="Icebreaker" value={user.icebreakerPrompt ? `${user.icebreakerPrompt} — ${user.icebreakerAnswer ?? ''}` : null} />
        <Field label="Bot PMs allowed" value={user.allowsWriteToPm === null ? '—' : String(user.allowsWriteToPm)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Premium</h2>
        <p className="text-sm text-slate-800">
          {user.premiumUntil && new Date(user.premiumUntil) > new Date()
            ? <>Active until <span className="font-medium">{new Date(user.premiumUntil).toLocaleString()}</span></>
            : 'Not premium'}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number" min={1} value={grantDays}
            onChange={(e) => setGrantDays(e.target.value)}
            className="w-24 border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <button
            onClick={grant} disabled={busy || !grantDays}
            className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            Grant days
          </button>
          {user.premiumUntil && (
            <button
              onClick={revoke} disabled={busy}
              className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Revoke
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Send message</h2>
        <p className="text-xs text-slate-400">
          Sends a direct Telegram bot DM to this user.
        </p>
        <textarea
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          maxLength={4096}
          rows={3}
          placeholder="Message to send via the bot…"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
        />
        <MessageButtonEditor draft={msgButton} onChange={setMsgButton} />
        <div className="flex items-center gap-3">
          <button
            onClick={sendMessage} disabled={sending || !msgText.trim()}
            className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send message'}
          </button>
          <span className="text-xs text-slate-400">{msgText.length}/4096</span>
          {msgResult && (
            <span className={`text-sm ${msgResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {msgResult.text}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.swipesGiven}</div>
          <div className="text-xs text-slate-500">swipes given</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.likesReceived}</div>
          <div className="text-xs text-slate-500">likes received</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.matches}</div>
          <div className="text-xs text-slate-500">matches</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-semibold">{counts.messagesSent}</div>
          <div className="text-xs text-slate-500">messages sent</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-medium text-slate-600 mb-2">Matches</h2>
        <ul className="divide-y divide-slate-100">
          {matches.map((m) => (
            <li key={m.matchId}>
              <Link to={`/chats/${m.matchId}`} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-slate-50">
                {m.user.photo
                  ? <img src={m.user.photo} className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-slate-200" />}
                <span className="text-sm text-slate-800 flex-1">{m.user.name || '(deleted)'}</span>
                <span className="text-xs text-slate-400">{new Date(m.matchedAt).toLocaleDateString()}</span>
              </Link>
            </li>
          ))}
          {matches.length === 0 && <li className="py-2 text-sm text-slate-400">No matches yet</li>}
        </ul>
      </div>
    </div>
  )
}
