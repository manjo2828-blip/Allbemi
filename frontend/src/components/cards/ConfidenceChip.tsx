import { CircleAlert } from 'lucide-react'
import { confidenceMeta } from '@/lib/labels'
import type { Confidence } from '@/lib/types'

/** 확신도(높음·보통·낮음) 표시. 확인이 필요하면 눈에 띄는 "확인 필요"를 함께 보여준다. 퍼센트는 쓰지 않는다. */
export default function ConfidenceChip({
  confidence,
  needsReview,
  size = 'md',
}: {
  confidence: Confidence
  needsReview: boolean
  size?: 'sm' | 'md'
}) {
  const text = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-0.5'
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`rounded-full border border-line-soft bg-surface font-medium text-muted ${text}`}>
        {confidenceMeta[confidence]}
      </span>
      {needsReview && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border-2 border-warn bg-warn-bg font-semibold text-warn-ink ${text}`}
        >
          <CircleAlert size={size === 'sm' ? 12 : 14} aria-hidden="true" />
          확인 필요
        </span>
      )}
    </span>
  )
}
