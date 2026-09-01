import type { MessageButton } from '../types'

const SCREENS = ['discovery', 'likes', 'matches', 'profile'] as const
type Screen = (typeof SCREENS)[number]

export interface ButtonDraft {
  type: 'none' | 'url' | 'screen'
  title: string
  url: string
  screen: Screen
}

export const emptyButtonDraft: ButtonDraft = { type: 'none', title: '', url: '', screen: 'discovery' }

/** Build the MessageButton payload from the draft, or undefined when empty. */
export function buildButton(d: ButtonDraft): MessageButton | undefined {
  if (d.type === 'none') return undefined
  const title = d.title.trim()
  if (!title) return undefined
  if (d.type === 'url') {
    const url = d.url.trim()
    return url ? { title, kind: 'url', url } : undefined
  }
  return { title, kind: 'screen', screen: d.screen }
}

const input = 'border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm'

/** Optional inline-button editor shared by the broadcast and single-user forms. */
export function MessageButtonEditor({ draft, onChange }: { draft: ButtonDraft; onChange: (d: ButtonDraft) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-slate-600">
        Button (optional)
        <select
          className={`${input} mt-1 block w-full`}
          value={draft.type}
          onChange={(e) => onChange({ ...draft, type: e.target.value as ButtonDraft['type'] })}
        >
          <option value="none">No button</option>
          <option value="url">Link to a URL</option>
          <option value="screen">Open an app screen</option>
        </select>
      </label>

      {draft.type !== 'none' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${input} flex-1 min-w-[10rem]`}
            placeholder="Button title"
            maxLength={64}
            value={draft.title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
          />
          {draft.type === 'url' ? (
            <input
              className={`${input} flex-1 min-w-[12rem]`}
              placeholder="https://…"
              value={draft.url}
              onChange={(e) => onChange({ ...draft, url: e.target.value })}
            />
          ) : (
            <select
              className={input}
              value={draft.screen}
              onChange={(e) => onChange({ ...draft, screen: e.target.value as Screen })}
            >
              {SCREENS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}
