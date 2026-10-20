import { verdictMeta } from '@/lib/labels'
import type { Verdict } from '@/lib/types'

const sizes = {
  sm: { box: 'gap-1 px-2.5 py-0.5 text-xs', icon: 13 },
  md: { box: 'gap-1.5 px-3 py-1 text-sm', icon: 15 },
  lg: { box: 'gap-2 px-5 py-2.5 text-xl', icon: 24 },
}

export default function VerdictBadge({ verdict, size = 'md' }: { verdict: Verdict; size?: keyof typeof sizes }) {
  const m = verdictMeta[verdict]
  const Icon = m.icon
  const s = sizes[size]
  return (
    <span className={`inline-flex items-center rounded-full border-2 font-bold ${s.box} ${m.cls}`}>
      <Icon size={s.icon} aria-hidden="true" />
      {m.label}
    </span>
  )
}
