import { processMeta } from '@/lib/labels'
import EvidenceQuote from './EvidenceQuote'
import type { ProcessStep } from '@/lib/types'

/** 업무 기록 카드의 과정: 시도 → 실패 → 막힘 → 결정 → 번복을 시간순으로 보여 준다. */
export default function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-line-soft pl-6">
      {steps.map((s, i) => {
        const meta = processMeta[s.type]
        const Icon = meta.icon
        return (
          <li key={i} className="relative">
            <span
              className={`absolute top-0.5 -left-[37px] flex h-7 w-7 items-center justify-center rounded-full border-2 ${meta.cls}`}
              aria-hidden="true"
            >
              <Icon size={14} />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${meta.cls}`}>
                {meta.label}
              </span>
              <span className="text-xs text-muted tabular-nums">{i + 1}단계</span>
            </div>
            <p className="mt-1 text-[15px] leading-relaxed">{s.text}</p>
            {s.evidence && (
              <div className="mt-2">
                <EvidenceQuote evidence={s.evidence} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
