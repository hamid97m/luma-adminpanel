import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { JoinTagList } from '../types'
import { TableSkeleton } from '../components/Loading'

const COLS = 9

export default function AdLinks() {
  const [data, setData] = useState<JoinTagList | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.joinTags.list()
      .then(setData)
      .catch(() => setError('Failed to load ad links'))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Ad links</h1>
      <p className="text-sm text-slate-500">
        Write any tag into the link:{' '}
        <code className="text-slate-800">https://t.me/{data?.botUsername ?? '<bot>'}?start=your_tag</code>
        {' '}(letters, digits, _ and -, up to 64). It appears here after the first person opens it.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3">Tag</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Signups</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Men</th>
              <th className="px-4 py-3">Women</th>
              <th className="px-4 py-3">Active 7d</th>
              <th className="px-4 py-3">Paying</th>
              <th className="px-4 py-3">Stars</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && <TableSkeleton rows={4} cols={COLS} />}
            {data?.items.map((t) => (
              <tr key={t.tag} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">
                  <Link to={`/users?tag=${encodeURIComponent(t.tag)}`} className="hover:underline">{t.tag}</Link>
                </td>
                <td className="px-4 py-2">{t.opened}</td>
                <td className="px-4 py-2">{t.signups}</td>
                <td className="px-4 py-2">{t.completed}</td>
                <td className="px-4 py-2">{t.men}</td>
                <td className="px-4 py-2">{t.women}</td>
                <td className="px-4 py-2">{t.active7d}</td>
                <td className="px-4 py-2">{t.payingUsers}</td>
                <td className="px-4 py-2">
                  {t.starsEarned}
                  {t.tomanEarned > 0 && (
                    <div className="text-xs text-slate-400">+ {t.tomanEarned.toLocaleString()} Toman</div>
                  )}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={COLS} className="px-4 py-6 text-center text-slate-400">No ad links opened yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
