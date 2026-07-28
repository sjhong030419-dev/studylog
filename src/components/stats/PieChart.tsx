interface PieSlice {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieSlice[]
  size?: number
}

export function PieChart({ data, size = 140 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total <= 0) {
    return (
      <div
        className="rounded-full bg-ink/5 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-ink-soft text-xs font-cute">데이터 없음</span>
      </div>
    )
  }

  let cursor = 0
  const stops = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const start = (cursor / total) * 360
      cursor += d.value
      const end = (cursor / total) * 360
      return `${d.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div className="flex items-center gap-4">
      <div
        className="rounded-full shrink-0"
        style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
      />
      <div className="flex flex-col gap-1">
        {data
          .filter((d) => d.value > 0)
          .map((d) => (
            <div key={d.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="font-cute text-xs text-ink">{d.label}</span>
              <span className="font-pixel text-[10px] text-ink-soft">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
