import type { ScheduleAttachment } from '@/lib/chatTools'

interface Props {
  data: ScheduleAttachment
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

export default function TodaySchedule({ data }: Props) {
  if (data.items.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">today's schedule</div>
        <div className="chart-empty">no scheduled doses today.</div>
      </div>
    )
  }
  return (
    <div className="chart-card">
      <div className="chart-title">today's schedule</div>
      <ul className="schedule-list">
        {data.items.map((it, i) => (
          <li key={`${it.medId}-${it.time}-${i}`} className={`schedule-row schedule-${it.status}`}>
            <span className="schedule-time">{formatTime(it.time)}</span>
            <span className="schedule-dot" />
            <span className="schedule-body">
              <span className="schedule-name">{it.medName}</span>
              <span className="schedule-dose">{it.dosage}</span>
            </span>
            <span className="schedule-status">{it.status}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
