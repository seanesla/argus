import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CorrelationsAttachment } from '@/lib/chatTools'

interface Props {
  data: CorrelationsAttachment
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

export default function CorrelationChart({ data }: Props) {
  if (data.items.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">patterns</div>
        <div className="chart-empty">
          {data.filter
            ? `no ${data.filter} patterns yet.`
            : "no patterns yet — keep logging and argus will watch."}
        </div>
      </div>
    )
  }

  const chartData = data.items.map((it) => ({
    label: `${it.symptom} · ${it.medicationName.split(' or ')[0]} ${formatTime(it.scheduledTime)}`,
    matched: it.matchedDays,
    rest: Math.max(0, it.observedDays - it.matchedDays),
    confidence: it.confidence,
    summary: it.summary,
  }))

  return (
    <div className="chart-card">
      <div className="chart-title">
        patterns
        {data.filter ? ` · ${data.filter}` : ''}
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={Math.max(120, 36 * chartData.length + 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.08)" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
            />
            <YAxis
              dataKey="label"
              type="category"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.75)' }}
              tickLine={false}
              axisLine={false}
              width={180}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{
                background: 'rgba(20,20,20,0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                fontSize: 12,
                maxWidth: 320,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              formatter={(value, name) => {
                if (name === 'matched') return [`${value} days`, 'co-occurred']
                if (name === 'rest') return [`${value} days`, 'no symptom']
                return [String(value), String(name)]
              }}
            />
            <Bar dataKey="matched" stackId="b" fill="var(--accent)" />
            <Bar dataKey="rest" stackId="b" fill="rgba(255,255,255,0.12)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="correlation-summaries">
        {data.items.map((it, i) => (
          <li key={i} className={`correlation-row correlation-${it.confidence}`}>
            <span className="correlation-tier">{it.confidence}</span>
            <span className="correlation-summary">{it.summary}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
