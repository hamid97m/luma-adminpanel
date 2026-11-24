import { useEffect, useState } from 'react'
import { api } from '../api'
import type { AskFriendStats } from '../types'
import { ListSkeleton } from './Loading'
import TrendChart from './TrendChart'

const DAY_OPTIONS = [1, 7, 30]

const QUESTIONS: Record<string, string> = { reply: 'Should I reply?', date: 'Go on a first date?', red_flag: 'Any red flags?' }
const OUTCOMES: Record<string, string> = {
  open: 'Still open', liked: 'She liked him', passed: 'She passed', messaged: 'She messaged him', expired: 'Expired, no decision',
  blocked: 'Blocked', target_gone: 'He left or was banned', requester_gone: 'She left or was banned',
}

const pct = (n: number, total: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '—')

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  )
}

function Bars({ title, rows, color }: { title: string; rows: { label: string; count: number; of?: number | null }[]; color: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  const total = rows.reduce((n, r) => n + r.count, 0)
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium text-slate-500">{title}</h3>
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm text-slate-800">
            <span>{r.label}</span>
            <span>
              {r.count}
              {r.of !== null && <span className="text-slate-400"> · {pct(r.count, r.of ?? total)}</span>}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full mt-1">
            <div className={`h-2 rounded-full ${color}`} style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-slate-400">None yet</p>}
    </section>
  )
}

export default function AskFriendCard() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState<AskFriendStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let current = true
    setData(null)
    setError(false)
    api.askFriend(days)
      .then((d) => { if (current) setData(d) })
      .catch(() => { if (current) setError(true) })
    return () => { current = false }
  }, [days])

  const sent = data ? data.friends.member.sent + data.friends.link.sent : 0
  const viewed = data ? data.friends.member.viewed + data.friends.link.viewed : 0
  const answered = data ? data.friends.member.answered + data.friends.link.answered : 0
  const hours = data?.asks.medianHoursToFirstAnswer ?? null

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-slate-600">Ask a friend</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Period"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {DAY_OPTIONS.map((d) => <option key={d} value={d}>Last {d === 1 ? '24 hours' : `${d} days`}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">Failed to load ask-a-friend stats</p>}
      {!error && !data && <ListSkeleton rows={4} avatar={false} />}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Asks sent" value={data.asks.total} hint={`by ${data.asks.women} women`} />
            <Tile label="Friends asked" value={sent} hint={`${data.friends.member.sent} in app · ${data.friends.link.sent} by link`} />
            <Tile label="Friends who answered" value={answered} hint={`${pct(answered, sent)} of friends asked`} />
            <Tile label="Asks with an answer" value={data.asks.withAnswer} hint={`${pct(data.asks.withAnswer, data.asks.total)} of asks`} />
            <Tile
              label="Time to first answer"
              value={hours === null ? '—' : hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} h`}
              hint="median"
            />
            <Tile label="Answers with a note" value={data.notes} hint={`${pct(data.notes, answered)} of answers`} />
            <Tile label="New signups from links" value={data.signups} hint="joined Luma after opening a link" />
            <Tile label="Friendships" value={data.friendships.active} hint={`all time · ${data.friendships.removed} removed`} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Bars
              title="Women: from hint to ask"
              color="bg-indigo-500"
              rows={[
                { label: 'Saw the hint', count: data.entry.sawTip, of: null },
                // The hint stops showing after her first tap, so it isn't a base for these.
                { label: 'Tapped ask a friend', count: data.entry.tapped, of: null },
                { label: 'Sent an ask (of those who tapped)', count: data.entry.asked, of: data.entry.tapped },
              ]}
            />
            <Bars
              title="Friends: from asked to answered"
              color="bg-teal-500"
              rows={[
                { label: 'Asked', count: sent, of: sent },
                { label: 'Saw the profile', count: viewed, of: sent },
                { label: 'Answered', count: answered, of: sent },
              ]}
            />
            <Bars
              title="Answers"
              color="bg-amber-500"
              rows={[
                { label: 'Yes', count: data.verdicts.yes },
                { label: 'Not sure', count: data.verdicts.unsure },
                { label: 'No', count: data.verdicts.no },
              ]}
            />
            <Bars title="What happened next" color="bg-rose-500" rows={data.outcomes.map((o) => ({ label: OUTCOMES[o.outcome] ?? o.outcome, count: o.count }))} />
            <Bars title="Question asked" color="bg-sky-500" rows={data.byQuestion.map((q) => ({ label: QUESTIONS[q.question] ?? q.question, count: q.count }))} />
          </div>

          {data.days > 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-1">Asks per day</h3>
                <TrendChart data={data.perDay.map((d) => ({ date: d.date, count: d.asks }))} color="#4f46e5" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-1">Answers per day</h3>
                <TrendChart data={data.perDay.map((d) => ({ date: d.date, count: d.answers }))} color="#0d9488" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
