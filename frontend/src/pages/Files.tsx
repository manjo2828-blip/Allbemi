import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Paperclip } from 'lucide-react'
import FilePreview from '@/components/cards/FilePreview'
import { cardById, cardPath, filesOfKind } from '@/lib/data'
import { fileIcon, fileKind } from '@/lib/labels'
import { formatDate, formatSize } from '@/lib/format'
import type { AttachedFile, CardKind } from '@/lib/types'

// 화면 I — 자료: 카드에 연결된 파일을 모아 본다. 내 업무 / 인수인계 두 영역이 같은 화면을 쓴다.
export default function Files({ kind: cardKind }: { kind: CardKind }) {
  const all = useMemo(() => filesOfKind(cardKind), [cardKind])
  const [kind, setKind] = useState('all')
  const [orphanOnly, setOrphanOnly] = useState(false)
  const [preview, setPreview] = useState<AttachedFile | null>(null)

  const kinds = useMemo(() => [...new Set(all.map((f) => fileKind(f.mime_type)))], [all])
  const orphans = all.filter((f) => f.linked_card_ids.length === 0)
  const shown = all.filter(
    (f) => (kind === 'all' || fileKind(f.mime_type) === kind) && (!orphanOnly || f.linked_card_ids.length === 0),
  )

  return (
    <div className="space-y-5">
      <section className="rounded-card border-2 border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="파일 형식">
            {['all', ...kinds].map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold ${
                  kind === k ? 'border-line bg-selected' : 'border-line-soft bg-page hover:border-line'
                }`}
              >
                {k === 'all' ? `전체 ${all.length}` : k}
              </button>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={orphanOnly}
              onChange={(e) => setOrphanOnly(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-brand)]"
            />
            연결 안 된 파일만 ({orphans.length})
          </label>
        </div>
      </section>

      {shown.length === 0 ? (
        <section className="rounded-card border-2 border-dashed border-line-soft bg-surface px-6 py-12 text-center">
          <p className="font-bold">{orphanOnly ? '연결되지 않은 파일이 없어요' : '자료가 없어요'}</p>
          <p className="mt-1 text-sm text-muted">
            {orphanOnly ? '모든 파일이 카드에 연결되어 있어요.' : '기록하기에서 로그와 함께 파일을 올리면 여기에 모여요.'}
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-card border-2 border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-line bg-sidebar text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">파일</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">설명</th>
                <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">올린 사람</th>
                <th className="px-4 py-2.5 font-semibold">연결된 카드</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => {
                const Icon = fileIcon(f.mime_type)
                return (
                  <tr key={f.id} className="border-b border-line-soft last:border-b-0 align-top">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setPreview(f)}
                        className="flex items-center gap-2.5 text-left font-semibold hover:text-brand"
                      >
                        <Icon size={18} aria-hidden="true" className="shrink-0 text-brand" />
                        <span>
                          {f.name}
                          <span className="block text-xs font-normal text-muted">
                            {fileKind(f.mime_type)} · {formatSize(f.size_bytes)}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 text-ink/80 md:table-cell">{f.note}</td>
                    <td className="hidden px-4 py-3 whitespace-nowrap lg:table-cell">
                      {f.uploaded_by}
                      <span className="block text-xs text-muted tabular-nums">{formatDate(f.uploaded_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {f.linked_card_ids.length === 0 ? (
                        <span className="text-muted">없음</span>
                      ) : (
                        <ul className="space-y-1">
                          {f.linked_card_ids.map((id) => (
                            <li key={id} className="flex items-start gap-1.5">
                              <Paperclip size={12} aria-hidden="true" className="mt-1 shrink-0 text-muted" />
                              <Link
                                to={cardPath(cardById(id) ?? { id, kind: cardKind })}
                                className="font-medium text-brand hover:underline"
                              >
                                {cardById(id)?.decision ?? id}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
