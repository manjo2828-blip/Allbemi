import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { findNav } from '@/lib/nav'
import { cards } from '@/lib/data'

export default function Topbar() {
  const { pathname } = useLocation()
  const nav = findNav(pathname)
  const reviewCount = cards.filter((c) => c.needs_review).length

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b-2 border-line bg-surface px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold leading-tight">{nav?.title ?? '페이지를 찾을 수 없어요'}</h1>
        {nav && <p className="truncate text-xs text-muted">{nav.summary}</p>}
      </div>

      <button
        type="button"
        className="relative rounded-lg border-2 border-line bg-page p-2 hover:bg-selected/60"
        aria-label={`확인 필요 ${reviewCount}건`}
      >
        <Bell size={18} aria-hidden="true" />
        {reviewCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-line bg-warn-bg px-1 text-[11px] font-bold text-warn-ink">
            {reviewCount}
          </span>
        )}
      </button>
    </header>
  )
}
