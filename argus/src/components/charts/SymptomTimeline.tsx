import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SymptomsAttachment } from '@/lib/chatTools'

interface Props {
  data: SymptomsAttachment
}

const COLORS = {
  mild: 'rgba(255,255,255,0.35)',
  moderate: 'var(--accent)',
  severe: '#d97757',
}

export default function SymptomTimeline({ data }: Props) {
  const total = data.buckets.reduce((acc, b) => acc + b.total, 0)

  return (
    <div className="chart-card">
      <div className="chart-title">
        symptoms · last {data.days} days
        {data.symptomFilter ? ` · ${data.symptomFilter}` : ''}
      </div>
      {total === 0 ? (
        <div className="chart-empty">
          nothing logged{data.symptomFilter ? ` for "${data.symptomFilter}"` : ''} in this window.
        </div>
      ) : (
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.buckets} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  background: 'rgba(20,20,20,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              <Bar dataKey="mild" stackId="a" fill={COLORS.mild} />
              <Bar dataKey="moderate" stackId="a" fill={COLORS.moderate} />
              <Bar dataKey="severe" stackId="a" fill={COLORS.severe} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span><span className="legend-swatch" style={{ background: COLORS.mild }} /> mild</span>
            <span><span className="legend-swatch" style={{ background: COLORS.moderate }} /> moderate</span>
            <span><span className="legend-swatch" style={{ background: COLORS.severe }} /> severe</span>
          </div>
        </div>
      )}
    </div>
  )
}
