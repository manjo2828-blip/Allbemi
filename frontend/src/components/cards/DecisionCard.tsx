import { Link } from 'react-router-dom'
import { ArrowRight, Paperclip, Ban } from 'lucide-react'
import StatusPill from './StatusPill'
import ConfidenceChip from './ConfidenceChip'
import { statusMeta, relationMeta, kindMeta } from '@/lib/labels'
import { cardById, cardPath, projectName } from '@/lib/data'
import { formatDate } from '@/lib/format'
import type { DecisionCard as Card, Relation } from '@/lib/types'

interface Props {
  card: Card
  /** list: 덱 목록용(작게, 누르면 상세로) · compare: 계획 비교 화면의 근거 카드 */
  variant?: 'list' | 'compare'
  /** compare에서 이 카드가 판정과 어떤 관계인지 */
  relation?: Relation
  /** compare에서 강조할 버려진 대안 이름 */
  highlightOption?: string | null
}

export default function DecisionCard({ card, variant = 'list', relation, highlightOption }: Props) {
  const meta = statusMeta[card.status]
  const successor = card.superseded_by ? cardById(card.superseded_by) : undefined
  const dim = card.status !== 'active'

  const inner = (
    <>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} aria-hidden="true" />
      <div className="pl-3">
        {relation && (
          <div className="mb-2 text-xs font-bold text-brand">{relationMeta[relation]}</div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {variant === 'compare' && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${kindMeta[card.kind].cls}`}>
              {kindMeta[card.kind].short}
            </span>
          )}
          <StatusPill status={card.status} size="sm" />
          <span className="rounded-full border border-line-soft bg-page px-2 py-0.5 text-xs font-medium">{projectName(card.project_id)}</span>
          <span className="rounded-full bg-sidebar px-2 py-0.5 text-xs font-medium text-muted">{card.topic}</span>
          {card.needs_review && <ConfidenceChip confidence={card.confidence} needsReview size="sm" />}
        </div>

        <h3
          className={`mt-2 text-[15px] leading-snug font-bold ${
            card.status === 'deprecated' ? 'text-muted line-through decoration-1' : dim ? 'text-ink/80' : ''
          }`}
        >
          {card.decision}
        </h3>

        {variant === 'compare' && (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{card.rationale}</p>
            {card.rejected_alternatives.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {card.rejected_alternatives.map((a) => (
                  <li
                    key={a.option}
                    className={`rounded-md border px-2.5 py-1.5 text-sm ${
                      highlightOption && a.option === highlightOption
                        ? 'border-rejected bg-rejected-bg text-rejected-ink'
                        : 'border-line-soft bg-page'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Ban size={13} aria-hidden="true" />
                      버린 대안 · {a.option}
                    </span>
                    <span className="mt-0.5 block text-[13px]">{a.reason_rejected}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{card.owner}</span>
          <span className="tabular-nums">{formatDate(card.decided_at)}</span>
          {card.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={12} aria-hidden="true" />
              {card.attachments.length}
            </span>
          )}
          {variant === 'list' && card.rejected_alternatives.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Ban size={12} aria-hidden="true" />
              버린 대안 {card.rejected_alternatives.length}
            </span>
          )}
        </div>

        {card.status === 'superseded' && successor && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-superseded-ink">
            <ArrowRight size={13} aria-hidden="true" />
            새 결정: {successor.decision}
          </div>
        )}
      </div>
    </>
  )

  const base = 'relative block overflow-hidden rounded-card border-2 border-line bg-surface p-4'
  return variant === 'list' ? (
    <Link to={cardPath(card)} className={`${base} transition-colors hover:bg-selected/40`}>
      {inner}
    </Link>
  ) : (
    <div className={base}>
      {inner}
      <div className="mt-3 pl-3">
        <Link to={cardPath(card)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          카드 열기 <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
