import { useState } from 'react'
import { api } from '../api'
import { genderLabel, otherGender } from '../utils/genderFlags'

function friendlyError(e: unknown, fallback: string): string {
  const msg = String((e as Error)?.message ?? '')
  if (msg.includes('not_a_seed_user')) return 'Backend only allows editing seed users — gender change not supported yet.'
  if (msg.includes('invalid_gender')) return 'Invalid gender.'
  return fallback
}

/** "Change gender" (with in-page confirm) + "Dismiss" for a gender-review flag. Calls onDone after success. */
export default function GenderFlagActions({ userId, gender, onDone }: {
  userId: string
  gender: string
  onDone: () => void
}) {
  const target = otherGender(gender)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action: () => Promise<unknown>, fallback: string) {
    setBusy(true); setError('')
    try { await action(); setConfirming(false); onDone() }
    catch (e) { setError(friendlyError(e, fallback)) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {target && !confirming && (
          <button
            onClick={() => setConfirming(true)} disabled={busy}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Change to {genderLabel(target)}
          </button>
        )}
        {target && confirming && (
          <>
            <span className="text-xs text-slate-600">Set gender to {genderLabel(target)}?</span>
            <button
              onClick={() => run(() => api.genderFlags.changeGender(userId, target), 'Gender change failed')}
              disabled={busy}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(false)} disabled={busy}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600"
            >
              Cancel
            </button>
          </>
        )}
        {!confirming && (
          <button
            onClick={() => run(() => api.genderFlags.dismiss(userId), 'Dismiss failed')} disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50"
          >
            Looks right — dismiss
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
