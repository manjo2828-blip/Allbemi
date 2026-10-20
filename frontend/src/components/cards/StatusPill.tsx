import { statusMeta } from '@/lib/labels'
import type { CardStatus } from '@/lib/types'

export default function StatusPill({ status, size = 'md' }: { status: CardStatus; size?: 'sm' | 'md' }) {
  const m = statusMeta[status]
  const Icon = m.icon
  const sizing = size === 'sm' ? 'gap-1 px-2 py-0.5 text-xs' : 'gap-1.5 px-3 py-1 text-sm'
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 font-semibold ${sizing} ${m.cls} ${
        status === 'deprecated' ? 'line-through decoration-1' : ''
      }`}
    >
      <Icon size={size === 'sm' ? 13 : 15} aria-hidden="true" />
      {m.label}
    </span>
  )
}
