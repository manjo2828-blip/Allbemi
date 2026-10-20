import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StatusPill from './StatusPill'
import { cardPath } from '@/lib/data'
import type { DecisionCard } from '@/lib/types'

/** 화면 D — 결정이 번복되어 온 흐름을 이전 → 이 카드 → 새 결정으로 이어서 보여 준다. */
export default function SupersedeChain({ chain, currentId }: { chain: DecisionCard[]; currentId: string }) {
  return (
    <ol className="flex flex-wrap items-stretch gap-2" aria-label="결정이 바뀐 순서">
      {chain.map((c, i) => {
        const current = c.id === currentId
        return (
          <li key={c.id} className="flex items-center gap-2">
            {i > 0 && <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-superseded" />}
            <Link
              to={cardPath(c)}
              aria-current={current ? 'page' : undefined}
              className={`block max-w-64 rounded-lg border-2 px-3 py-2 text-sm ${
                current ? 'border-line bg-selected font-semibold' : 'border-line-soft bg-page hover:border-line'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <StatusPill status={c.status} size="sm" />
                {current && <span className="text-xs font-bold text-brand">이 카드</span>}
              </span>
              <span
                className={`mt-1 block leading-snug ${c.status === 'deprecated' ? 'text-muted line-through decoration-1' : ''}`}
              >
                {c.decision}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
