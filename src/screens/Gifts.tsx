import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { api } from '../api'
import type { GiftBalance, GiftConfig, GiftTransaction } from '../types'
import StatCard from '../components/StatCard'
import Pagination from '../components/Pagination'

const STATUS_LABEL: Record<GiftTransaction['status'], string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  sent: 'Sent',
  send_failed: 'Send failed',
  refunded: 'Refunded',
}

const STATUS_COLOR: Record<GiftTransaction['status'], string> = {
  pending_payment: 'text-slate-500',
  paid: 'text-amber-600',
  sent: 'text-green-600',
  send_failed: 'text-red-600',
  refunded: 'text-slate-500',
}

function ConfigForm() {
  const [form, setForm] = useState({ markupPercent: '', lowBalanceThreshold: '' })
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.gifts.config()
      .then((cfg: GiftConfig) => {
        setForm({ markupPercent: String(cfg.markupPercent), lowBalanceThreshold: String(cfg.lowBalanceThreshold) })
        setLoaded(true)
      })
      .catch(() => setError('Failed to load config'))
  }, [])

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setSaved(false)
    setForm({ ...form, [key]: e.target.value })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)
    try {
      const cfg = await api.gifts.updateConfig({
        markupPercent: Number(form.markupPercent),
        lowBalanceThreshold: Number(form.lowBalanceThreshold),
      })
      setForm({ markupPercent: String(cfg.markupPercent), lowBalanceThreshold: String(cfg.lowBalanceThreshold) })
      setSaved(true)
    } catch {
      setError('Failed to save — check the values are non-negative integers')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 bg-white'

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-600">Markup settings</h2>
      {!loaded && !error && <p className="text-sm text-slate-400">Loading…</p>}
      {loaded && (
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Markup %</label>
            <input
              className={input}
              type="number"
              min={0}
              step={1}
              value={form.markupPercent}
              onChange={set('markupPercent')}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Low-balance threshold (Stars)</label>
            <input
              className={input}
              type="number"
              min={0}
              step={1}
              value={form.lowBalanceThreshold}
              onChange={set('lowBalanceThreshold')}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && !error && <p className="text-sm text-green-600">Saved.</p>}
          <button
            disabled={busy || form.markupPercent === '' || form.lowBalanceThreshold === ''}
            className="bg-slate-900 text-white rounded-lg px-5 py-2 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  )
}

function BalanceCard() {
  const [balance, setBalance] = useState<GiftBalance | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.gifts.balance().then(setBalance).catch(() => setError('Failed to load balance'))
  }, [])

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-slate-600">Bot Star balance</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Balance"
            value={balance ? (balance.balance === null ? 'Unavailable' : `${balance.balance} ⭐`) : '…'}
          />
          <StatCard
            label="Low-balance threshold"
            value={balance ? `${balance.lowBalanceThreshold} ⭐` : '…'}
          />
        </div>
      )}
      {balance?.low && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          Low balance — top up the bot&apos;s Stars.
        </div>
      )}
    </div>
  )
}

type StatusFilter = GiftTransaction['status'] | 'all'
type ContextFilter = GiftTransaction['context'] | 'all'

function TransactionsList() {
  const [items, setItems] = useState<GiftTransaction[] | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [context, setContext] = useState<ContextFilter>('all')
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    api.gifts.transactions({
      page,
      status: status === 'all' ? undefined : status,
      context: context === 'all' ? undefined : context,
    })
      .then((d) => {
        setItems(d.items)
        setPageCount(d.pageCount)
      })
      .catch(() => setError('Failed to load transactions'))
  }, [status, context, page])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-600">Transactions</h2>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            value={status}
            onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1) }}
          >
            <option value="all">All statuses</option>
            <option value="pending_payment">Pending payment</option>
            <option value="paid">Paid</option>
            <option value="sent">Sent</option>
            <option value="send_failed">Send failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            value={context}
            onChange={(e) => { setContext(e.target.value as ContextFilter); setPage(1) }}
          >
            <option value="all">All contexts</option>
            <option value="chat">Chat</option>
            <option value="discovery">Discovery</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {items === null && <p className="p-6 text-center text-sm text-slate-400">Loading…</p>}
          {items?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3">
              <div className="text-2xl w-8 text-center">{t.emoji || '🎁'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">
                  {t.buyerName || '(deleted)'} <span className="text-slate-400">→</span> {t.recipientName || '(deleted)'}
                </div>
                <div className="text-xs text-slate-400">
                  {t.context}
                  {t.introStatus ? ` · intro ${t.introStatus}` : ''}
                  {' · '}
                  {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800">
                  {t.chargedStars} ⭐
                  {t.markupStars > 0 && <span className="text-slate-400"> (+{t.markupStars})</span>}
                </div>
                <div className={`text-xs ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</div>
              </div>
            </div>
          ))}
          {items && items.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">No gift transactions yet.</p>
          )}
        </div>
      )}
      {!error && items && <Pagination page={page} pageCount={pageCount} onPage={setPage} />}
    </div>
  )
}

export default function Gifts() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Gifts</h1>
      <ConfigForm />
      <BalanceCard />
      <TransactionsList />
    </div>
  )
}
