import { useLocation } from 'react-router-dom'
import { findNav } from '@/lib/nav'

// 아직 만들지 않은 화면의 자리. 어떤 단계에서 만드는지 보여 준다.
export default function Placeholder() {
  const { pathname } = useLocation()
  const nav = findNav(pathname)
  if (!nav) return null
  const Icon = nav.icon

  return (
    <section className="rounded-card border-2 border-line bg-surface p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-sidebar">
          <Icon size={24} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{nav.title}</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{nav.summary}</p>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">화면</dt>
            <dd className="font-medium">{nav.screen}</dd>
            <dt className="text-muted">만드는 단계</dt>
            <dd className="font-medium">{nav.step}</dd>
          </dl>
          <p className="mt-6 rounded-lg border border-line-soft bg-page px-4 py-3 text-sm text-muted">
            아직 만들지 않은 화면입니다. 위 단계에서 이 자리에 채웁니다.
          </p>
        </div>
      </div>
    </section>
  )
}
