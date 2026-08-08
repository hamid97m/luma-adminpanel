import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Stats, UserListItem } from '../types'
import StatCard from '../components/StatCard'
import TrendChart from '../components/TrendChart'
import { PageLoader } from '../components/Loading'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<UserListItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.stats().then(setStats).catch(() => setError('Failed to load stats'))
    api.users.list({ page: 1 }).then((r) => setRecent(r.items.slice(0, 8))).catch(() => {})
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!stats) return <PageLoader />

  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats.totals.users} hint={`+${stats.today.newUsers} today · +${stats.week.newUsers} this week`} />
        <StatCard label="Matches" value={stats.totals.matches} hint={`+${stats.today.matches} today`} />
        <StatCard label="Messages" value={stats.totals.messages} hint={`+${stats.today.messages} today`} />
        <StatCard label="Swipes" value={stats.totals.swipes} hint={`${pct(stats.totals.likeRate)} likes`} />
        <StatCard label="DAU" value={stats.dau} hint={`WAU ${stats.wau}`} />
        <StatCard label="Genders" value={`${stats.genders.man}♂ ${stats.genders.woman}♀`} hint={`${stats.genders.nonbinary} nonbinary`} />
        <StatCard label="Banned" value={stats.totals.banned} hint={`${stats.totals.deleted} deleted`} />
        <StatCard label="Seed profiles" value={stats.totals.seed} />
        <StatCard label="Premium users" value={stats.premium.activeUsers} />
        <StatCard label="Premium revenue" value={`${stats.premium.revenueStars} ⭐`} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-slate-600 mb-2">Signups — last 30 days</h2>
          <TrendChart data={stats.signupsPerDay} color="#4f46e5" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-slate-600 mb-2">Matches — last 30 days</h2>
          <TrendChart data={stats.matchesPerDay} color="#e11d48" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-slate-600 mb-2">New premium users — last 30 days</h2>
          <TrendChart data={stats.premium.newPremiumPerDay} color="#0d9488" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-medium text-slate-600 mb-2">Recent signups</h2>
        <ul className="divide-y divide-slate-100">
          {recent.map((u) => (
            <li key={u.id}>
              <Link to={`/users/${u.id}`} className="flex justify-between py-2 text-sm hover:bg-slate-50 px-2 rounded">
                <span className="text-slate-800">{u.name} <span className="text-slate-400">· {u.age} · {u.gender}</span></span>
                <span className="text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </Link>
            </li>
          ))}
          {recent.length === 0 && <li className="py-2 text-sm text-slate-400">No users yet</li>}
        </ul>
      </div>
    </div>
  )
}
