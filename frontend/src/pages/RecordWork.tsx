import { useReducer, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ban,
  CircleCheck,
  CloudUpload,
  Info,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'
import FlipCard from '@/components/cards/FlipCard'
import StatusPill from '@/components/cards/StatusPill'
import ConfidenceChip from '@/components/cards/ConfidenceChip'
import ProcessTimeline from '@/components/cards/ProcessTimeline'
import AttachmentChip from '@/components/cards/AttachmentChip'
import FilePreview from '@/components/cards/FilePreview'
import { assignProject, cardPath, linkFileToCard, projectName, saveEntry } from '@/lib/data'
import { createEntry, projectOptions, sampleLogs, type EntryResult } from '@/lib/extract'
import { fileIcon, kindMeta } from '@/lib/labels'
import { formatSize } from '@/lib/format'
import { useAppState } from '@/lib/AppState'
import type { AttachedFile, DecisionCard } from '@/lib/types'

const ACCEPT = '.pdf,.pptx,.xlsx,.docx,.png,.jpg,.jpeg'
// 지원 형식·크기 제한은 아직 정해지지 않았다 (TODO: 추후결정). 목업은 위 형식과 20MB로 둔다.
const MAX_BYTES = 20 * 1024 * 1024

// 화면 C — 내 업무 기록하기: 로그를 붙여넣고 파일을 함께 올리면 결정과 과정이 담긴 카드가 뒤집히며 만들어진다.
export default function RecordWork() {
  const { user } = useAppState()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [projectId, setProjectId] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<EntryResult | null>(null)
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [preview, setPreview] = useState<AttachedFile | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | File[]) {
    const next: File[] = []
    const problems: string[] = []
    for (const f of Array.from(list)) {
      const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase()
      if (!ACCEPT.split(',').includes(ext)) problems.push(`${f.name}: 지원하지 않는 형식이에요`)
      else if (f.size > MAX_BYTES) problems.push(`${f.name}: 파일이 너무 커요 (최대 20MB)`)
      else if (!files.some((x) => x.name === f.name && x.size === f.size)) next.push(f)
    }
    setFileError(problems.length ? problems.join(' · ') : null)
    if (next.length) setFiles((prev) => [...prev, ...next])
  }

  async function submit() {
    if (!text.trim()) {
      setError('업무 로그를 먼저 붙여넣어 주세요.')
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const r = await createEntry({ text, files, projectId, owner: user?.name ?? '나' })
      saveEntry({ log: r.log, cards: r.cards, files: r.files })
      setResult(r)
    } catch {
      setError('카드를 만들지 못했어요. 잠시 뒤에 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setText('')
    setFiles([])
    setProjectId('auto')
    setError(null)
    setFileError(null)
  }

  return (
    <div className="space-y-6">
      {!result && (
        <section className="rounded-card border-2 border-line bg-surface p-6">
          <h2 className="text-lg font-bold">오늘의 업무 대화·메모를 붙여넣어 보세요</h2>
          <p className="mt-1 text-sm text-muted">형식은 필요 없어요. 결정과 그 과정(시도, 실패, 막힘)을 찾아 카드로 만들어 드려요.</p>

          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div>
              <label htmlFor="log" className="sr-only">
                업무 로그
              </label>
              <textarea
                id="log"
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (error) setError(null)
                }}
                rows={8}
                placeholder={'예) 박민준: 세션 캐시는 Redis로 가려고 합니다.\n정우진: Memcached도 검토했는데 이점이 작아요.\n정우진: 세션 캐시는 Redis로 확정하죠.'}
                className="w-full resize-y rounded-lg border-2 border-line bg-page px-4 py-3 text-base leading-relaxed placeholder:text-muted/70"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Sparkles size={13} aria-hidden="true" />
                  예시 불러오기
                </span>
                {sampleLogs.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setText(s.text)
                      setError(null)
                    }}
                    className="rounded-full border-2 border-line-soft bg-page px-3 py-1 text-sm hover:border-line hover:bg-selected/50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 파일 드롭존 */}
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  addFiles(e.dataTransfer.files)
                }}
                className={`flex flex-col items-center gap-2 rounded-card border-2 border-dashed px-6 py-6 text-center transition-colors ${
                  dragOver ? 'border-brand bg-selected/50' : 'border-line-soft bg-page'
                }`}
              >
                <CloudUpload size={26} aria-hidden="true" className="text-brand" />
                <p className="text-sm font-medium">관련 자료 파일을 여기에 끌어다 놓으세요</p>
                <p className="text-xs text-muted">PDF · PPTX · XLSX · DOCX · 이미지, 파일당 20MB까지 (목업 기준)</p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-1 rounded-lg border-2 border-line bg-surface px-4 py-1.5 text-sm font-semibold hover:bg-selected/50"
                >
                  파일 선택
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="sr-only"
                  aria-label="자료 파일 선택"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>
              {fileError && (
                <p className="mt-2 text-sm font-medium text-rejected-ink" role="alert">
                  {fileError}
                </p>
              )}
              {files.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="올린 파일">
                  {files.map((f) => {
                    const Icon = fileIcon(f.type || f.name)
                    return (
                      <li
                        key={f.name + f.size}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border-2 border-line-soft bg-surface px-2.5 py-1 text-sm"
                      >
                        <Icon size={15} aria-hidden="true" className="shrink-0 text-brand" />
                        <span className="truncate font-medium">{f.name}</span>
                        <span className="text-xs text-muted">{formatSize(f.size)}</span>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                          className="rounded p-0.5 text-muted hover:bg-selected hover:text-ink"
                          aria-label={`${f.name} 빼기`}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="project" className="text-sm font-medium">
                  프로젝트
                </label>
                <select
                  id="project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="rounded-lg border-2 border-line bg-page px-3 py-1.5 text-sm font-medium"
                >
                  <option value="auto">내용으로 자동 정하기</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <div className="min-h-5 text-sm font-medium text-rejected-ink" role="alert">
                  {error}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-line bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-70"
                >
                  {loading ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
                  {loading ? '카드 만드는 중…' : '카드 만들기'}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {!result && (
        <p className="flex items-start gap-2 rounded-lg border border-line-soft bg-surface px-4 py-2.5 text-xs text-muted">
          <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          목업이라 "확정하죠", "검토했는데", "뺐습니다" 같은 표현만 알아보고, 만든 카드는 새로고침하면 사라져요. 실제 추출은 에이전트 단계에서 연결해요.
        </p>
      )}

      {loading && (
        <section className="flex items-center gap-3 rounded-card border-2 border-dashed border-line-soft bg-surface px-6 py-10 text-sm text-muted" aria-live="polite">
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          기록을 읽고 결정과 과정을 찾고 있어요…
        </section>
      )}

      {result && <Result result={result} onReset={reset} bump={bump} onPreview={setPreview} />}
      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function Result({
  result,
  onReset,
  bump,
  onPreview,
}: {
  result: EntryResult
  onReset: () => void
  bump: () => void
  onPreview: (f: AttachedFile) => void
}) {
  const { cards, files, file_links, same_topic } = result
  const [pick, setPick] = useState<Record<string, string>>({})
  const unknown = cards.some((c) => c.project_id === '')

  return (
    <section className="space-y-5" aria-label="만들어진 카드">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-line bg-surface px-5 py-4">
        <div>
          <h2 className="text-lg font-bold">
            {cards.length > 0 ? `카드 ${cards.length}장이 만들어졌어요` : '결정으로 보이는 내용을 찾지 못했어요'}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {cards.length > 0
              ? '내 업무 카드 덱에 임시로 저장했어요. 확신이 낮은 카드는 "확인 필요"로 표시했어요.'
              : '"~로 확정하죠", "~로 정합니다"처럼 결정이 드러나는 문장이 있으면 카드가 만들어져요.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-line bg-page px-4 py-2 text-sm font-semibold hover:bg-selected/50"
        >
          <RotateCcw size={15} aria-hidden="true" />
          다른 기록 올리기
        </button>
      </div>

      {unknown && (
        <div className="flex flex-wrap items-center gap-3 rounded-card border-2 border-warn bg-warn-bg px-5 py-3 text-warn-ink" role="note">
          <TriangleAlert size={18} aria-hidden="true" className="shrink-0" />
          <p className="text-sm font-medium">내용만으로는 어느 프로젝트인지 정하지 못했어요. 프로젝트를 지정해 주세요.</p>
          <select
            aria-label="프로젝트 지정"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return
              assignProject(
                cards.map((c) => c.id),
                files.map((f) => f.id),
                e.target.value,
              )
              bump()
            }}
            className="rounded-lg border-2 border-warn bg-surface px-3 py-1.5 text-sm font-medium text-ink"
          >
            <option value="">프로젝트 고르기</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((c, i) => (
          <FlipCard key={c.id} delay={250 + i * 450}>
            <NewCard card={c} prev={same_topic[c.id]} />
          </FlipCard>
        ))}
      </div>

      {files.length > 0 && (
        <div className="rounded-card border-2 border-line bg-surface p-5">
          <h3 className="text-sm font-bold text-muted">함께 올린 자료 {files.length}</h3>
          <ul className="mt-3 space-y-3">
            {files.map((f) => {
              const link = file_links.find((l) => l.file_id === f.id)!
              const linkedTo = f.linked_card_ids[0] ? cards.find((c) => c.id === f.linked_card_ids[0]) : undefined
              return (
                <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <AttachmentChip file={f} onOpen={onPreview} />
                  {linkedTo ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <CircleCheck size={15} aria-hidden="true" className="text-active" />
                      {link.link_status === 'suggested' && !pick[f.id] ? '자동으로 연결했어요' : '연결했어요'}: {linkedTo.decision}
                    </span>
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-warn bg-warn-bg px-2 py-0.5 text-xs font-bold text-warn-ink">
                        <TriangleAlert size={12} aria-hidden="true" />
                        연결 확인 필요
                      </span>
                      <select
                        aria-label={`${f.name}을(를) 연결할 카드`}
                        defaultValue=""
                        onChange={(e) => {
                          if (!e.target.value) return
                          linkFileToCard(f.id, e.target.value, '직접 연결한 자료')
                          setPick((p) => ({ ...p, [f.id]: e.target.value }))
                          bump()
                        }}
                        className="max-w-xs rounded-lg border-2 border-line bg-page px-2 py-1 text-sm"
                      >
                        <option value="">연결할 카드 고르기</option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.decision}
                          </option>
                        ))}
                      </select>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

function NewCard({ card, prev }: { card: DecisionCard; prev?: DecisionCard }) {
  const files = card.attachments
  return (
    <article className="relative h-full overflow-hidden rounded-card border-2 border-line bg-surface p-5">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-active" aria-hidden="true" />
      <div className="pl-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${kindMeta.work.cls}`}>{kindMeta.work.label}</span>
          <StatusPill status={card.status} size="sm" />
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              card.project_id ? 'border-line-soft bg-page' : 'border-warn bg-warn-bg text-warn-ink'
            }`}
          >
            {projectName(card.project_id)}
          </span>
          <ConfidenceChip confidence={card.confidence} needsReview={card.needs_review} size="sm" />
        </div>

        <h3 className="mt-3 text-lg leading-snug font-bold">{card.decision}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">{card.rationale}</p>

        {card.rejected_alternatives.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {card.rejected_alternatives.map((a) => (
              <li key={a.option} className="rounded-md border border-line-soft bg-page px-2.5 py-1.5 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Ban size={13} aria-hidden="true" className="text-rejected" />
                  버린 대안 · {a.option}
                </span>
                <span className="mt-0.5 block text-[13px]">{a.reason_rejected}</span>
              </li>
            ))}
          </ul>
        )}

        {card.process.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-bold text-muted">과정 {card.process.length}단계</div>
            <ProcessTimeline steps={card.process} />
          </div>
        )}

        {files.length > 0 && (
          <p className="mt-3 text-xs text-muted">첨부 자료 {files.length}개 연결됨</p>
        )}

        {prev && (
          <p className="mt-3 flex items-start gap-1.5 rounded-md border border-warn bg-warn-bg px-2.5 py-1.5 text-xs text-warn-ink">
            <TriangleAlert size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>같은 주제의 기존 결정이 있어요: “{prev.decision}”. 번복인지 확인해 주세요.</span>
          </p>
        )}

        <Link to={cardPath(card)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          카드 열기 →
        </Link>
      </div>
    </article>
  )
}
