// Shared loading primitives so every screen shows a consistent, polished
// loading state instead of bare "Loading…" text.

export function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-slate-400 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
    </svg>
  )
}

// Full-page centered loader for detail screens.
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <Spinner className="w-8 h-8" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

// A single shimmering placeholder block.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}

// Skeleton rows for a card list (Chats / Reports / Support / FakeUsers style).
export function ListSkeleton({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          {avatar && <Skeleton className="w-10 h-10 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// Skeleton rows for a <table>; render inside <tbody>.
export function TableSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-50">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className={`h-3 ${c === 0 ? 'w-32' : 'w-16'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
