import type { DayCount } from '../types'

export default function BarChart({ data, color = '#0f172a' }: { data: DayCount[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const barW = 100 / data.length
  return (
    <svg viewBox="0 0 100 40" className="w-full h-32" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.count / max) * 36
        return (
          <rect
            key={d.date}
            x={i * barW + barW * 0.15}
            y={40 - h}
            width={barW * 0.7}
            height={h}
            rx={0.5}
            fill={color}
          >
            <title>{`${d.date}: ${d.count}`}</title>
          </rect>
        )
      })}
    </svg>
  )
}
