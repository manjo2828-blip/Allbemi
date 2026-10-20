import { useRef, useState } from 'react'
import { Ban, Info, LoaderCircle, Search, Sparkles, TriangleAlert } from 'lucide-react'
import DecisionCard from '@/components/cards/DecisionCard'
import VerdictBadge from '@/components/cards/VerdictBadge'
import ConfidenceChip from '@/components/cards/ConfidenceChip'
import EvidenceQuote from '@/components/cards/EvidenceQuote'
import { cardById, judgments } from '@/lib/data'
import { verdictMeta } from '@/lib/labels'
import { judge } from '@/lib/mockApi'
import type { Judgment } from '@/lib/types'

// 화면 B · 장면 ① — 내가 하려는 일을 과거 결정과 나란히 놓고 판정을 본다.
export default function Compare() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Judgment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Judgment[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  const examples = judgments.map((j) => j.intent.text)

  async function run(input: string) {
    const value = input.trim()
    if (!value) {
      setError('하려는 일을 먼저 입력해 주세요.')
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const j = await judge(value)
      setResult(j)
      setHistory((h) => [j, ...h.filter((x) => x.intent.text !== j.intent.text)].slice(0, 5))
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch {
      setError('비교하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 입력 */}
      <section className="rounded-card border-2 border-line bg-surface p-6">
        <h2 className="text-lg font-bold">하려는 일을 입력해 보세요</h2>
        <p className="mt-1 text-sm text-muted">
          과거에 같은 안을 검토하고 버렸는지, 지금 결정과 충돌하는지 먼저 알려 드려요. 내 업무 기록과 인수인계 카드를 모두 찾아요.
        </p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(text)
          }}
        >
          <label htmlFor="intent" className="sr-only">
            하려는 일
          </label>
          <textarea
            id="intent"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                run(text)
              }
            }}
            rows={2}
            placeholder={examples[0] ?? "하려는 일을 입력하세요"}
            className="w-full resize-none rounded-lg border-2 border-line bg-page px-4 py-3 text-base leading-relaxed placeholder:text-muted/70"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-h-5 text-sm font-medium text-rejected-ink" role="alert">
              {error}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-line bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-70"
            >
              {loading ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
              {loading ? '찾는 중…' : '비교하기'}
            </button>
          </div>
        </form>

        {examples.length > 0 && (
          <div className="mt-4 border-t-2 border-line-soft pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Sparkles size={13} aria-hidden="true" />
              이런 문장으로 해 보세요
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setText(ex)
                    run(ex)
                  }}
                  className="rounded-full border-2 border-line-soft bg-page px-3 py-1 text-sm hover:border-line hover:bg-selected/50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-lg border border-line-soft bg-surface px-4 py-2.5 text-xs text-muted">
        <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
        목업이라 예시 문장과 버려진 대안 이름만 알아봐요. 실제 판정은 에이전트 단계에서 연결해요.
      </p>

      {loading && (
        <section className="flex items-center gap-3 rounded-card border-2 border-dashed border-line-soft bg-surface px-6 py-10 text-sm text-muted" aria-live="polite">
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          관련 기록을 찾고 있어요…
        </section>
      )}

      {/* 결과 */}
      {result && <div ref={resultRef}><Result result={result} /></div>}

      {/* 최근 비교 */}
      {history.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-muted">최근 비교</h3>
          <ul className="mt-2 space-y-1.5">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => {
                    setText(h.intent.text)
                    setResult(h)
                    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border-2 border-line-soft bg-surface px-3 py-2 text-left hover:border-line"
                >
                  <VerdictBadge verdict={h.verdict} size="sm" />
                  <span className="truncate text-sm">{h.intent.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Result({ result }: { result: Judgment }) {
  const matched = result.matched_cards
    .map((m) => ({ ...m, card: cardById(m.card_id) }))
    .filter((m) => !!m.card)

  return (
    <section className="space-y-4" aria-label="비교 결과">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_230px_minmax(0,1fr)]">
        {/* 내 입력 카드 */}
        <div className="relative overflow-hidden rounded-card border-2 border-line bg-surface p-4">
          <span className="absolute inset-y-0 left-0 w-1.5 bg-brand" aria-hidden="true" />
          <div className="pl-3">
            <div className="text-xs font-bold text-brand">내가 하려는 일</div>
            <p className="mt-2 text-lg leading-snug font-bold">{result.intent.text}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-sidebar px-2 py-0.5 font-medium text-muted">{result.intent.topic}</span>
              {result.intent.proposed_option && (
                <span className="rounded-full border border-line-soft bg-page px-2 py-0.5 font-medium">
                  제안: {result.intent.proposed_option}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 판정 */}
        <div className="flex flex-col items-center gap-3 py-1 text-center">
          <VerdictBadge verdict={result.verdict} size="lg" />
          <p className="text-sm font-medium text-ink/80">{verdictMeta[result.verdict].desc}</p>
          <ConfidenceChip confidence={result.confidence} needsReview={result.needs_review} />
        </div>

        {/* 근거 카드 */}
        <div className="space-y-3">
          {matched.length === 0 ? (
            <div className="rounded-card border-2 border-dashed border-line-soft bg-surface p-5 text-sm text-muted">
              연결된 카드가 없어요.
            </div>
          ) : (
            matched.map((m) => (
              <div key={m.card_id} className="space-y-2">
                <DecisionCard
                  card={m.card!}
                  variant="compare"
                  relation={m.relation}
                  highlightOption={m.relation === 'rejected_alternative' ? result.intent.proposed_option : null}
                />
                <div className="rounded-lg border-2 border-line-soft bg-page px-3 py-2 text-sm">
                  <span className="text-xs font-bold text-muted">판정 근거 </span>
                  {m.evidence_quote}
                </div>
                {m.card!.evidence[0] && <EvidenceQuote evidence={m.card!.evidence[0]} />}
              </div>
            ))
          )}
        </div>
      </div>

      {result.verdict === 'rejected' && result.rejected_reason && (
        <div className="flex items-start gap-3 rounded-card border-2 border-rejected bg-rejected-bg px-5 py-4 text-rejected-ink">
          <Ban size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-bold">기각 이유</div>
            <p className="mt-0.5 text-[15px] leading-relaxed">{result.rejected_reason}</p>
          </div>
        </div>
      )}

      <div className="rounded-card border-2 border-line bg-surface px-5 py-4">
        <div className="text-sm font-bold">설명</div>
        <p className="mt-1 text-[15px] leading-relaxed">{result.explanation}</p>
      </div>

      {result.needs_review && (
        <div className="flex items-start gap-3 rounded-card border-2 border-warn bg-warn-bg px-5 py-4 text-warn-ink" role="note">
          <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-bold">확인이 필요해요</div>
            <p className="mt-0.5 text-sm leading-relaxed">
              근거가 짧거나 모호해서 결과가 틀릴 수 있어요. 근거 카드와 원문을 직접 확인해 주세요.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
