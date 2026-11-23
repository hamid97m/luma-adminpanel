import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { GenderFlagItem, Paginated } from '../types'
import Pagination from '../components/Pagination'
import { Skeleton } from '../components/Loading'
import GenderFlagActions from '../components/GenderFlagActions'
import { contradicts, genderLabel } from '../utils/genderFlags'

function Guess({ label, selected, guess }: { label: string; selected: string; guess: string | null }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-sm ${contradicts(selected, guess) ? 'font-medium text-red-600' : 'text-slate-700'}`}>
        {genderLabel(guess)}
      </div>
    </div>
  )
}

export default function GenderReview() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<GenderFlagItem> | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    let cancelled = false
    api.genderFlags.list(page)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError('Failed to load gender flags') })
    return () => { cancelled = true }
  }, [page])

  useEffect(() => { setData(null); return load() }, [load])

  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Gender Review{data ? <span className="text-slate-400 font-normal"> · {data.total}</span> : null}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Users whose selected gender disagrees with the AI's guess from their main photo or name. These are hints
          only — nobody is blocked or paused automatically. Change the gender if it is clearly wrong, otherwise dismiss.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
        {!data && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            <Skeleton className="w-20 h-20 rounded-lg" />
            <div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/4" /><Skeleton className="h-3 w-1/2" /></div>
          </div>
        ))}
        {data?.items.map((f) => (
          <div key={f.user.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
            {f.user.photoUrl ? (
              <a href={f.user.photoUrl} target="_blank" rel="noreferrer" className="shrink-0">
                <img src={f.user.photoUrl} className="w-20 h-20 rounded-lg object-cover" />
              </a>
            ) : (
              <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">No photo</div>
            )}
            <div className="md:w-44 shrink-0">
              <Link to={`/users/${f.user.id}`} className="block text-sm font-medium text-slate-800 truncate hover:underline" dir="auto">
                {f.user.name || '(no name)'}{f.user.age ? <span className="text-slate-400 font-normal"> · {f.user.age}</span> : null}
              </Link>
              {f.user.bannedAt && <div className="text-xs text-red-600">Banned</div>}
              {f.user.pausedAt && <div className="text-xs text-amber-600">Paused</div>}
              <div className="text-xs text-slate-400">{new Date(f.checkedAt).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 md:w-80 shrink-0">
              <div>
                <div className="text-xs text-slate-400">Selected</div>
                <div className="text-sm font-medium text-slate-900">{genderLabel(f.user.gender)}</div>
              </div>
              <Guess label="AI photo guess" selected={f.user.gender} guess={f.photoGender} />
              <Guess label="AI name guess" selected={f.user.gender} guess={f.nameGender} />
            </div>
            <div className="flex-1 md:flex md:justify-end">
              <GenderFlagActions userId={f.user.id} gender={f.user.gender} onDone={load} />
            </div>
          </div>
        ))}
        {data && data.items.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">No users to review.</div>
        )}
      </div>

      {data && <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />}
    </div>
  )
}
