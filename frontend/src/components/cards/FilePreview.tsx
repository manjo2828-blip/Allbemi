import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, X } from 'lucide-react'
import { cardById } from '@/lib/data'
import { fileIcon, fileKind } from '@/lib/labels'
import { formatDate, formatSize } from '@/lib/format'
import type { AttachedFile } from '@/lib/types'

/** 자료 미리보기 창. 목업에서는 파일 본체가 없어서 정보만 보여준다 (파일 업로드·저장은 백엔드 B5). */
export default function FilePreview({ file, onClose }: { file: AttachedFile; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const Icon = fileIcon(file.mime_type)
  const linked = file.linked_card_ids.map(cardById).filter((c) => !!c)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${file.name} 미리보기`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-card border-2 border-line bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-sidebar">
              <Icon size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{file.name}</h2>
              <p className="text-xs text-muted">
                {fileKind(file.mime_type)} · {formatSize(file.size_bytes)} · {file.uploaded_by} · {formatDate(file.uploaded_at)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded-md p-1.5 hover:bg-selected/60">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed">{file.note}</p>

        <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-line-soft bg-page text-sm text-muted">
          미리보기 영역 (목업에는 파일 본체가 없어요)
        </div>

        {linked.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-muted">연결된 카드</div>
            <ul className="mt-1.5 space-y-1">
              {linked.map((c) => (
                <li key={c!.id}>
                  <Link to={`/deck/${c!.id}`} onClick={onClose} className="text-sm font-medium text-brand hover:underline">
                    {c!.decision}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled
            title="파일 저장은 백엔드 단계(B5)에서 연결해요"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border-2 border-line-soft bg-page px-4 py-2 text-sm font-semibold text-muted"
          >
            <Download size={15} aria-hidden="true" />
            다운로드
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-2 border-line bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
