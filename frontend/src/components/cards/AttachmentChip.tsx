import { fileIcon } from '@/lib/labels'
import type { AttachedFile } from '@/lib/types'

/** 카드에 연결된 자료 한 개를 작게 보여준다. 누르면 미리보기를 연다. */
export default function AttachmentChip({ file, onOpen }: { file: AttachedFile; onOpen?: (f: AttachedFile) => void }) {
  const Icon = fileIcon(file.mime_type)
  const body = (
    <>
      <Icon size={15} aria-hidden="true" className="shrink-0 text-brand" />
      <span className="truncate">{file.name}</span>
    </>
  )
  const cls =
    'inline-flex max-w-full items-center gap-1.5 rounded-lg border-2 border-line-soft bg-surface px-2.5 py-1 text-sm font-medium'
  return onOpen ? (
    <button type="button" onClick={() => onOpen(file)} className={`${cls} hover:border-line hover:bg-selected/50`}>
      {body}
    </button>
  ) : (
    <span className={cls}>{body}</span>
  )
}
