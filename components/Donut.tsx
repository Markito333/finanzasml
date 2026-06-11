'use client'

import { formatearMoneda } from '@/lib/utils'

interface Segment {
  label: string
  value: number
  color: string
}

interface DonutProps {
  data: Segment[]
  size?: number
  strokeWidth?: number
  maxLegends?: number
  legendSize?: 'sm' | 'md'
}

export default function Donut({ data, size = 144, strokeWidth = 18, maxLegends, legendSize = 'sm' }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const segments = data.filter((d) => d.value > 0)
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const gap = strokeWidth + 2

  let cum = 0
  const arcs = segments.map((s) => {
    const pct = s.value / total
    const start = cum
    cum += pct
    const dashLen = Math.max(pct * c - gap, 0)
    return { ...s, dash: `${dashLen} ${c - dashLen}`, offset: -start * c }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={strokeWidth}
              strokeDasharray={a.dash}
              strokeDashoffset={a.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div
          className="absolute bg-white rounded-full flex flex-col items-center justify-center"
          style={{ top: strokeWidth, right: strokeWidth, bottom: strokeWidth, left: strokeWidth }}
        >
          <span className="text-lg font-bold text-zinc-800">{formatearMoneda(total)}</span>
          <span className="text-[9px] text-zinc-400 -mt-0.5">Total</span>
        </div>
      </div>
      <div className={`flex flex-wrap justify-center ${legendSize === 'md' ? 'gap-x-4 gap-y-1.5' : 'gap-x-3 gap-y-1'}`}>
        {(maxLegends ? segments.slice(0, maxLegends) : segments).map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`rounded-full flex-shrink-0 ${legendSize === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} style={{ backgroundColor: s.color }} />
            <span className={`${legendSize === 'md' ? 'text-[11px]' : 'text-[10px]'} text-zinc-500`}>
              {s.label} ({Math.round((s.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
