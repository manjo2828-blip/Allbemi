import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import DecisionCard from '@/components/cards/DecisionCard'
import { cardsOfKind, projects } from '@/lib/data'
import type { CardKind } from '@/lib/types'

type Filter = 'all' | 'active' | 'superseded' | 'deprecated' | 'review'

const filters: { value: Filter; label: string; tone: string }[] = [
  { value: 'all', label: '전체', tone: 'border-line bg-surface' },
  { value: 'active', label: '유효', tone: 'border-active bg-active-bg text-active-ink' },
  { value: 'superseded', label: '대체됨', tone: 'border-superseded bg-superseded-bg text-superseded-ink' },
  { value: 'deprecated', label: '철회', tone: 'border-neutral bg-neutral-bg text-neutral-ink' },
  { value: 'review', label: '확인 필요', tone: 'border-warn bg-warn-bg text-warn-ink' },
]

// 화면 A — 카드 덱. 내 업무(업무 기록 카드) / 인수인계(인수인계 카드) 두 영역이 같은 화면을 쓴다.
// 프로젝트는 고르는 단위가 아니라 카드의 이름표라서, 필요하면 아래 필터로 좁힌다.
export default function Deck({ kind }: { kind: CardKind }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [topic, setTopic] = useState('all')
  const [project, setProject] = useState('all')
  const [desc, setDesc] = useState(false)

  const all = useMemo(() => cardsOfKind(kind), [kind])
  const inProject = useMemo(() => all.filter((c) => project === 'all' || c.project_id === project), [all, project])
  const count = (f: Filter) =>
    f === 'all'
      ? inProject.length
      : f === 'review'
        ? inProject.filter((c) => c.needs_review).length
        : inProject.filter((c) => c.status === f).length
  const topics = useMemo(() => [...new Set(inProject.map((c) => c.topic))], [inProject])
  const projectIds = useMemo(() => [...new Set(all.map((c) => c.project_id).filter(Boolean))], [all])

  const shown = useMemo(() => {
    const list = inProject.filter(
      (c) =>
        (filter === 'all' || (filter === 'review' ? c.needs_review : c.status === filter)) &&
        (topic === 'all' || c.topic === topic),
    )
    return list.sort((a, b) => (desc ? -1 : 1) * a.decided_at.localeCompare(b.decided_at))
  }, [inProject, filter, topic, desc])

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        {kind === 'work'
          ? '평소 업무 로그에서 만들어진 카드예요. 카드를 열면 결정에 이른 과정이 보여요.'
          : '인계자가 업무 기록 카드에서 만들어 넘긴 카드예요. 막히면 카드를 열어 원본 기록(과정)으로 내려갈 수 있어요.'}
      </p>

      <section className="rounded-card border-2 border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="상태 필터">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors ${f.tone} ${
                  filter === f.value ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {f.label} <span className="tabular-nums">{count(f.value)}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {projectIds.length > 1 && (
              <>
                <label htmlFor="project-filter" className="sr-only">
                  프로젝트
                </label>
                <select
                  id="project-filter"
                  value={project}
                  onChange={(e) => {
                    setProject(e.target.value)
                    setTopic('all')
                  }}
                  className="rounded-lg border-2 border-line bg-page px-3 py-1.5 text-sm font-medium"
                >
                  <option value="all">모든 프로젝트</option>
                  {projectIds.map((id) => (
                    <option key={id} value={id}>
                      {projects.find((p) => p.id === id)?.name ?? id}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label htmlFor="topic" className="sr-only">
              주제
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-lg border-2 border-line bg-page px-3 py-1.5 text-sm font-medium"
            >
              <option value="all">모든 주제</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDesc(!desc)}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-line bg-page px-3 py-1.5 text-sm font-medium hover:bg-selected/50"
            >
              {desc ? <ArrowDownWideNarrow size={15} aria-hidden="true" /> : <ArrowUpNarrowWide size={15} aria-hidden="true" />}
              {desc ? '최신순' : '오래된 순'}
            </button>
          </div>
        </div>
      </section>

      <p className="text-sm text-muted" aria-live="polite">
        카드 {shown.length}장
      </p>

      {shown.length === 0 ? (
        <section className="rounded-card border-2 border-dashed border-line-soft bg-surface px-6 py-12 text-center">
          <p className="font-bold">조건에 맞는 카드가 없어요</p>
          <p className="mt-1 text-sm text-muted">필터를 바꾸거나 모든 주제를 선택해 보세요.</p>
        </section>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((c) => (
            <DecisionCard key={c.id} card={c} />
          ))}
        </div>
      )}
    </div>
  )
}
