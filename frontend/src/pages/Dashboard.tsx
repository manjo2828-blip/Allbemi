import { Link } from 'react-router-dom'
import { cardsOfKind } from '@/lib/data'
import { useAppState } from '@/lib/AppState'

// F8에서 본격적으로 만든다. 지금은 예시 데이터가 화면까지 연결되는지만 확인한다.
export default function Dashboard() {
  const { user } = useAppState()
  const work = cardsOfKind('work')
  const handover = cardsOfKind('handover')
  const count = (s: string) => work.filter((c) => c.status === s).length

  const stats = [
    { label: '유효', value: count('active'), tone: 'bg-active-bg text-active-ink border-active' },
    { label: '대체됨', value: count('superseded'), tone: 'bg-superseded-bg text-superseded-ink border-superseded' },
    { label: '철회', value: count('deprecated'), tone: 'bg-neutral-bg text-neutral-ink border-neutral' },
    { label: '확인 필요', value: work.filter((c) => c.needs_review).length, tone: 'bg-warn-bg text-warn-ink border-warn' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{user?.name}님, 안녕하세요.</h2>
        <p className="mt-1 text-sm text-muted">
          평소 업무를 과정까지 기록해 두고, 필요할 때 인수인계 카드를 만들어 넘기거나 받은 카드를 확인해요.
        </p>
      </div>

      <section className="rounded-card border-2 border-line bg-surface p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-bold">내 업무 카드 상태</h3>
          <Link to="/work/deck" className="text-sm font-semibold text-brand hover:underline">
            내 업무 카드 덱 →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-lg border-2 px-4 py-3 ${s.tone}`}>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">업무 기록 카드 전체 {work.length}장</p>
      </section>

      <section className="rounded-card border-2 border-line bg-surface p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-bold">인수인계</h3>
          <Link to="/handover/deck" className="text-sm font-semibold text-brand hover:underline">
            인수인계 카드 덱 →
          </Link>
        </div>
        <p className="mt-2 text-sm text-ink/80">인수인계 카드 {handover.length}장이 만들어져 있어요.</p>
      </section>

      <p className="rounded-lg border border-line-soft bg-surface px-4 py-3 text-sm text-muted">
        대시보드의 나머지(확인할 일, 빠른 계획 비교, 최근 결정, 인수인계 진행)는 F8에서 채웁니다.
      </p>
    </div>
  )
}
