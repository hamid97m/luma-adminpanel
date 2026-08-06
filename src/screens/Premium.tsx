import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { api } from '../api'
import type { PremiumConfig, PremiumPlan, PremiumPlanInput, PremiumTransaction } from '../types'
import Pagination from '../components/Pagination'

const STATUS_LABEL: Record<PremiumTransaction['status'], string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  refunded: 'Refunded',
}

const STATUS_COLOR: Record<PremiumTransaction['status'], string> = {
  pending_payment: 'text-slate-500',
  paid: 'text-green-600',
  refunded: 'text-red-600',
}

const SOURCE_LABEL: Record<PremiumTransaction['source'], string> = {
  purchase: 'purchase',
  admin_grant: 'admin grant',
}

function ToggleCard() {
  const [premiumEnabled, setPremiumEnabled] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.premium.config()
      .then((cfg: PremiumConfig) => {
        setPremiumEnabled(cfg.premiumEnabled)
        setLoaded(true)
      })
      .catch(() => setError('Failed to load config'))
  }, [])

  function onToggle(e: ChangeEvent<HTMLInputElement>) {
    setSaved(false)
    setPremiumEnabled(e.target.checked)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)
    try {
      const cfg = await api.premium.updateConfig({ premiumEnabled })
      setPremiumEnabled(cfg.premiumEnabled)
      setSaved(true)
    } catch {
      setError('Failed to save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-600">Premium gate</h2>
      {!loaded && !error && <p className="text-sm text-slate-400">Loading…</p>}
      {loaded && (
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={premiumEnabled} onChange={onToggle} />
            Premium gate enabled
          </label>
          <p className="text-xs text-slate-500">
            When ON, sending a message to a woman requires an active premium plan.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && !error && <p className="text-sm text-green-600">Saved.</p>}
          <button
            disabled={busy}
            className="bg-slate-900 text-white rounded-lg px-5 py-2 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  title: '',
  description: '',
  priceStars: '',
  discountPercent: '',
  discountEndsAt: '',
  durationDays: '',
  sortOrder: '0',
  isActive: true,
}

// datetime-local expects "YYYY-MM-DDTHH:mm" in local time.
function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(local: string): string | null {
  if (!local) return null
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function nowPlusHoursLocalInput(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() + hours)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function PlanForm({ editing, onDone, onCancel }: {
  editing: PremiumPlan | null
  onDone: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(
    editing
      ? {
          title: editing.title,
          description: editing.description,
          priceStars: String(editing.priceStars),
          discountPercent: editing.discountPercent === null ? '' : String(editing.discountPercent),
          discountEndsAt: editing.discountEndsAt ? isoToLocalInput(editing.discountEndsAt) : '',
          durationDays: String(editing.durationDays),
          sortOrder: String(editing.sortOrder),
          isActive: editing.isActive,
        }
      : EMPTY_FORM,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data: PremiumPlanInput = {
        title: form.title,
        description: form.description,
        priceStars: Number(form.priceStars),
        discountPercent: form.discountPercent === '' ? null : Number(form.discountPercent),
        discountEndsAt: localInputToIso(form.discountEndsAt),
        durationDays: Number(form.durationDays),
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
      }
      if (editing) {
        await api.premium.updatePlan(editing.id, data)
      } else {
        await api.premium.createPlan(data)
      }
      onDone()
    } catch {
      setError('Failed to save plan — check the values (price/duration ≥ 1, discount 1–90)')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 bg-white'

  return (
    <form onSubmit={onSubmit} className="bg-slate-50 rounded-xl p-5 space-y-4 max-w-md">
      <h3 className="text-sm font-medium text-slate-600">{editing ? 'Edit plan' : 'New plan'}</h3>
      <input className={input} placeholder="Title *" maxLength={32} value={form.title} onChange={set('title')} />
      <textarea className={input} placeholder="Description" rows={2} maxLength={255} value={form.description} onChange={set('description')} />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Full price ⭐ *</label>
          <input className={input} type="number" min={1} step={1} value={form.priceStars} onChange={set('priceStars')} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Discount % (1–90)</label>
          <input className={input} type="number" min={1} max={90} step={1} value={form.discountPercent} onChange={set('discountPercent')} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Discount ends (optional)</label>
        <input
          className={input}
          type="datetime-local"
          value={form.discountEndsAt}
          onChange={set('discountEndsAt')}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, discountEndsAt: nowPlusHoursLocalInput(24) })}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600"
          >
            +24h
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, discountEndsAt: nowPlusHoursLocalInput(24 * 3) })}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600"
          >
            +3d
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, discountEndsAt: nowPlusHoursLocalInput(24 * 7) })}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600"
          >
            +7d
          </button>
          {form.discountEndsAt && (
            <button
              type="button"
              onClick={() => setForm({ ...form, discountEndsAt: '' })}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Duration (days) *</label>
          <input className={input} type="number" min={1} step={1} value={form.durationDays} onChange={set('durationDays')} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Sort order</label>
          <input className={input} type="number" step={1} value={form.sortOrder} onChange={set('sortOrder')} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
        />
        Active
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          disabled={busy || !form.title || !form.priceStars || !form.durationDays}
          className="bg-slate-900 text-white rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Create plan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-5 py-2 text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function PlansSection() {
  const [plans, setPlans] = useState<PremiumPlan[] | null>(null)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [editing, setEditing] = useState<PremiumPlan | null>(null)
  const [adding, setAdding] = useState(false)

  function reload() {
    api.premium.plans()
      .then((d) => setPlans(d.plans))
      .catch(() => setError('Failed to load plans'))
  }

  useEffect(reload, [])

  function onDone(target: string) {
    setAdding((prev) => (target === 'new' ? false : prev))
    setEditing((prev) => (prev && prev.id === target ? null : prev))
    reload()
  }

  async function onToggleActive(p: PremiumPlan) {
    try {
      await api.premium.updatePlan(p.id, { isActive: !p.isActive })
      reload()
    } catch {
      setDeleteError('Failed to update plan')
    }
  }

  async function onDelete(p: PremiumPlan) {
    setDeleteError('')
    try {
      await api.premium.deletePlan(p.id)
      reload()
    } catch (e) {
      const err = e as { status?: number }
      if (err.status === 409) {
        setDeleteError('This plan has purchases — deactivate it instead.')
      } else {
        setDeleteError('Failed to delete plan')
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-600">Plans</h2>
        {!adding && !editing && (
          <button
            onClick={() => setAdding(true)}
            className="bg-slate-900 text-white rounded-lg px-4 py-1.5 text-sm"
          >
            Add plan
          </button>
        )}
      </div>

      {adding && <PlanForm key="new" editing={null} onDone={() => onDone('new')} onCancel={() => setAdding(false)} />}
      {editing && <PlanForm key={editing.id} editing={editing} onDone={() => onDone(editing.id)} onCancel={() => setEditing(null)} />}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

      {!error && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Full price ⭐</th>
                <th className="px-4 py-3">Discount %</th>
                <th className="px-4 py-3">Discount ends</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans?.map((p) => {
                const expired = !!p.discountEndsAt && new Date(p.discountEndsAt).getTime() <= Date.now()
                const discountedPrice = p.discountPercent
                  ? Math.max(1, Math.round(p.priceStars * (1 - p.discountPercent / 100)))
                  : null
                return (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{p.title}</td>
                  <td className="px-4 py-2 text-slate-500 max-w-xs truncate">{p.description || '—'}</td>
                  <td className="px-4 py-2">{p.priceStars}</td>
                  <td className="px-4 py-2">
                    {p.discountPercent ?? '—'}
                    {discountedPrice !== null && (
                      <span className="text-xs text-slate-400"> → {discountedPrice} ⭐</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {p.discountEndsAt
                      ? <span className={expired ? 'text-red-600' : ''}>{new Date(p.discountEndsAt).toLocaleString()}{expired ? ' (expired)' : ''}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-2">{p.durationDays}</td>
                  <td className="px-4 py-2">{p.sortOrder}</td>
                  <td className="px-4 py-2">
                    {p.isActive
                      ? <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">active</span>
                      : <span className="text-xs rounded-full bg-slate-200 text-slate-600 px-2 py-0.5">inactive</span>}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button className="text-slate-600 hover:underline" onClick={() => { setAdding(false); setEditing(p) }}>Edit</button>
                      <button className="text-slate-600 hover:underline" onClick={() => onToggleActive(p)}>
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="text-red-600 hover:underline" onClick={() => onDelete(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {plans && plans.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">No plans yet</td></tr>
              )}
            </tbody>
          </table>
          {plans === null && <p className="p-6 text-center text-sm text-slate-400">Loading…</p>}
        </div>
      )}
    </div>
  )
}

type StatusFilter = PremiumTransaction['status'] | 'all'
type SourceFilter = PremiumTransaction['source'] | 'all'

function TransactionsList() {
  const [items, setItems] = useState<PremiumTransaction[] | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [source, setSource] = useState<SourceFilter>('all')
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    api.premium.transactions({
      page,
      status: status === 'all' ? undefined : status,
      source: source === 'all' ? undefined : source,
    })
      .then((d) => {
        setItems(d.items)
        setPageCount(d.pageCount)
      })
      .catch(() => setError('Failed to load transactions'))
  }, [status, source, page])

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
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            value={source}
            onChange={(e) => { setSource(e.target.value as SourceFilter); setPage(1) }}
          >
            <option value="all">All sources</option>
            <option value="purchase">Purchase</option>
            <option value="admin_grant">Admin grant</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {items === null && <p className="p-6 text-center text-sm text-slate-400">Loading…</p>}
          {items?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">
                  {t.userName}{t.userUsername ? ` (@${t.userUsername})` : ''}
                </div>
                <div className="text-xs text-slate-400">
                  {t.planTitle} · {t.durationDays}d · {SOURCE_LABEL[t.source]} · {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800">{t.priceStars} ⭐</div>
                <div className={`text-xs ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</div>
              </div>
            </div>
          ))}
          {items && items.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">No premium transactions yet.</p>
          )}
        </div>
      )}
      {!error && items && <Pagination page={page} pageCount={pageCount} onPage={setPage} />}
    </div>
  )
}

export default function Premium() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Premium</h1>
      <ToggleCard />
      <PlansSection />
      <TransactionsList />
    </div>
  )
}
