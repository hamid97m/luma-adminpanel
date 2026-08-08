import { useId, useMemo, useState } from 'react'
import type { DayCount } from '../types'

// A smooth area + line chart for a single daily series.
// Uses a fixed viewBox with non-scaling strokes so it stays crisp at any width.
const VW = 300
const VH = 120
const PAD_T = 10
const PAD_B = 14

type Point = { x: number; y: number; d: DayCount }

// Catmull-Rom → cubic Bézier for a smooth (but non-overshooting-ish) curve.
function smoothPath(pts: Point[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export default function TrendChart({ data, color = '#0f172a' }: { data: DayCount[]; color?: string }) {
  const uid = useId().replace(/[:]/g, '')
  const [hover, setHover] = useState<number | null>(null)

  const { pts, max, total } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.count))
    const total = data.reduce((s, d) => s + d.count, 0)
    const innerH = VH - PAD_T - PAD_B
    const n = data.length
    const pts: Point[] = data.map((d, i) => ({
      x: n <= 1 ? VW / 2 : (i / (n - 1)) * VW,
      y: PAD_T + innerH - (d.count / max) * innerH,
      d,
    }))
    return { pts, max, total }
  }, [data])

  const line = smoothPath(pts)
  const area = pts.length
    ? `${line} L ${pts[pts.length - 1].x} ${VH - PAD_B} L ${pts[0].x} ${VH - PAD_B} Z`
    : ''

  const active = hover != null ? pts[hover] : null
  const gridYs = [0, 0.5, 1].map((t) => PAD_T + (VH - PAD_T - PAD_B) * t)

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (pts.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(ratio * (pts.length - 1))))
    setHover(idx)
  }

  const fmtDate = (s: string) => {
    const dt = new Date(s)
    return isNaN(dt.getTime()) ? s : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-32" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={0}
            x2={VW}
            y1={y}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {area && <path d={area} fill={`url(#fill-${uid})`} />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* hover crosshair + dot */}
        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD_T}
              y2={VH - PAD_B}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={active.x} cy={active.y} r={5} fill="#fff" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </>
        )}

        {/* invisible hit area */}
        <rect
          x={0}
          y={0}
          width={VW}
          height={VH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {/* tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: `${(active.x / VW) * 100}%`, top: `${(active.y / VH) * 100}%`, marginTop: -8 }}
        >
          <div className="font-semibold leading-tight">{active.d.count}</div>
          <div className="text-[10px] text-slate-300 leading-tight">{fmtDate(active.d.date)}</div>
        </div>
      )}

      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{pts.length ? fmtDate(pts[0].d.date) : ''}</span>
        <span className="text-slate-500">peak {max} · total {total}</span>
        <span>{pts.length ? fmtDate(pts[pts.length - 1].d.date) : ''}</span>
      </div>
    </div>
  )
}
