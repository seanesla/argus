import type { ChartAttachment as ChartAttachmentType } from '@/lib/chatTools'
import SupplyCard from './SupplyCard'
import SymptomTimeline from './SymptomTimeline'
import TodaySchedule from './TodaySchedule'
import CorrelationChart from './CorrelationChart'

interface Props {
  attachment: ChartAttachmentType
}

export default function ChartAttachment({ attachment }: Props) {
  switch (attachment.kind) {
    case 'supply':
      return <SupplyCard data={attachment} />
    case 'symptoms':
      return <SymptomTimeline data={attachment} />
    case 'schedule':
      return <TodaySchedule data={attachment} />
    case 'correlations':
      return <CorrelationChart data={attachment} />
    default: {
      const _exhaustive: never = attachment
      return _exhaustive
    }
  }
}
