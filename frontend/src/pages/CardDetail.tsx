import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, CircleCheck, CornerDownRight, TriangleAlert } from 'lucide-react'
import StatusPill from '@/components/cards/StatusPill'
import ConfidenceChip from '@/components/cards/ConfidenceChip'
import EvidenceQuote from '@/components/cards/EvidenceQuote'
import AttachmentChip from '@/components/cards/AttachmentChip'
import FilePreview from '@/components/cards/FilePreview'
import ProcessTimeline from '@/components/cards/ProcessTimeline'
import SupersedeChain from '@/components/cards/SupersedeChain'
import { cardById, cardPath, cards, fileById, handoverCardsFrom, projectName, supersedeChain } from '@/lib/data'
import { kindMeta, originMeta } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import type { AttachedFile } from '@/lib/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border-2 border-line bg-surface p-5">
      <h2 className="text-sm font-bold text-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

// 화면 A — 카드 상세 (이유, 버린 대안, 과정, 원문 근거, 첨부 자료). 업무 기록 카드와 인수인계 카드가 함께 쓴다.
export default function CardDetail() {
  const { cardId = '' } = useParams()
  const card = cardById(cardId)
  const [preview, setPreview] = useState<AttachedFile | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => setConfirmed(false), [cardId])

  if (!card) {
    return (
      <section className="rounded-card border-2 border-line bg-surface p-8">
        <h2 className="text-xl font-bold">카드를 찾을 수 없어요</h2>
        <Link to="/work/deck" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft size={14} aria-hidden="true" /> 내 업무 카드 덱으로 돌아가기
        </Link>
      </section>
    )
  }

  const isHandover = card.kind === 'handover'
  const deckPath = isHandover ? '/handover/deck' : '/work/deck'
  const chain = supersedeChain(card)
  const sources = card.source_card_ids.map((id) => cardById(id)).filter((c) => !!c)
  const derived = handoverCardsFrom(card.id)
  const projectHasHandover = cards.some((c) => c.kind === 'handover' && c.project_id === card.project_id)
  const showReview = card.needs_review && !confirmed

  return (
    <div className="space-y-4">
      <Link to={deckPath} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft size={14} aria-hidden="true" /> {isHandover ? '인수인계 카드 덱' : '내 업무 카드 덱'}
      </Link>

      {/* 제목 */}
      <header className="rounded-card border-2 border-line bg-surface p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-sm font-bold ${kindMeta[card.kind].cls}`}>
            {kindMeta[card.kind].label}
          </span>
          <StatusPill status={card.status} />
          <span className="rounded-full border border-line-soft bg-page px-2.5 py-0.5 text-sm font-medium">{projectName(card.project_id)}</span>
          <span className="rounded-full bg-sidebar px-2.5 py-0.5 text-sm font-medium text-muted">{card.topic}</span>
          <ConfidenceChip confidence={card.confidence} needsReview={card.needs_review && !confirmed} />
        </div>
        <h1
          className={`mt-3 text-2xl leading-snug font-bold ${
            card.status === 'deprecated' ? 'text-muted line-through decoration-1' : ''
          }`}
        >
          {card.decision}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {card.owner} · <span className="tabular-nums">{formatDate(card.decided_at)}</span> · {originMeta[card.origin]}
        </p>
      </header>

      {showReview && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-warn bg-warn-bg px-5 py-4 text-warn-ink" role="note">
          <div className="flex items-start gap-3">
            <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-bold">확인이 필요한 카드예요</div>
              <p className="mt-0.5 text-sm">근거가 짧아서 AI가 확신하지 못했어요. 원문을 보고 맞는지 확인해 주세요.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-warn bg-surface px-4 py-2 text-sm font-semibold hover:bg-warn-bg"
          >
            <CircleCheck size={15} aria-hidden="true" />
            확인했어요
          </button>
        </div>
      )}
      {card.needs_review && confirmed && (
        <p className="rounded-lg border border-line-soft bg-surface px-4 py-2 text-xs text-muted">
          확인 표시는 목업이라 저장되지 않아요. 저장은 백엔드 단계에서 연결해요.
        </p>
      )}

      {/* 인수인계 카드: 어떤 업무 기록에서 만들어졌는지 */}
      {isHandover && (
        <Section title={`원본 업무 기록 ${sources.length}`}>
          <p className="text-sm text-muted">이 카드는 아래 업무 기록 카드에서 만들어졌어요. 열면 결정에 이른 과정이 보여요.</p>
          <ul className="mt-3 space-y-2">
            {sources.map((s) => (
              <li key={s!.id}>
                <Link
                  to={cardPath(s!)}
                  className="flex items-start gap-2 rounded-lg border-2 border-line-soft bg-page px-3 py-2.5 hover:border-line"
                >
                  <CornerDownRight size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusPill status={s!.status} size="sm" />
                      <span className="text-sm font-semibold text-brand">{s!.decision}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {s!.owner} · {formatDate(s!.decided_at)}
                      {s!.process.length > 0 && ` · 과정 ${s!.process.length}단계`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="왜 그렇게 정했나">
          <p className="text-[15px] leading-relaxed">{card.rationale}</p>
        </Section>

        <Section title={`버린 대안 ${card.rejected_alternatives.length}`}>
          {card.rejected_alternatives.length === 0 ? (
            <p className="text-sm text-muted">기록된 버린 대안이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {card.rejected_alternatives.map((a) => (
                <li key={a.option} className="rounded-lg border-2 border-line-soft bg-page px-3 py-2.5">
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <Ban size={14} aria-hidden="true" className="text-rejected" />
                    {a.option}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{a.reason_rejected}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* 업무 기록 카드: 과정 타임라인 */}
      {!isHandover && (
        <Section title={`과정 ${card.process.length}단계`}>
          {card.process.length === 0 ? (
            <p className="text-sm text-muted">기록된 과정이 없어요. 로그에 시도와 실패가 적혀 있으면 자동으로 채워져요.</p>
          ) : (
            <ProcessTimeline steps={card.process} />
          )}
        </Section>
      )}

      {/* 화면 D: 결정이 번복되어 온 흐름 */}
      {chain.length > 1 && (
        <Section title="결정이 바뀐 흐름">
          <SupersedeChain chain={chain} currentId={card.id} />
        </Section>
      )}

      {/* 업무 기록 카드: 인수인계에 반영됐는지 */}
      {!isHandover && projectHasHandover && (
        <Section title="인수인계 반영">
          {derived.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {derived.map((d) => (
                <li key={d.id} className="flex items-start gap-1.5">
                  <CircleCheck size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-active" />
                  <span>
                    인수인계 카드에 반영됐어요:{' '}
                    <Link to={cardPath(d)} className="font-semibold text-brand hover:underline">
                      {d.decision}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-start gap-1.5 text-sm text-warn-ink">
              <TriangleAlert size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
              아직 인수인계 카드에 반영되지 않았어요. 점검에서 빈 자리로 표시돼요.
            </p>
          )}
        </Section>
      )}

      <Section title={`근거 원문 ${card.evidence.length}`}>
        <div className="space-y-2">
          {card.evidence.map((e, i) => (
            <EvidenceQuote key={i} evidence={e} />
          ))}
        </div>
      </Section>

      <Section title={`첨부 자료 ${card.attachments.length}`}>
        {card.attachments.length === 0 ? (
          <p className="text-sm text-muted">연결된 자료가 없어요.</p>
        ) : (
          <ul className="space-y-2.5">
            {card.attachments.map((a) => {
              const f = fileById(a.file_id)
              return (
                f && (
                  <li key={a.file_id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <AttachmentChip file={f} onOpen={setPreview} />
                    <span className="text-sm text-muted">{a.note}</span>
                  </li>
                )
              )
            })}
          </ul>
        )}
      </Section>

      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
