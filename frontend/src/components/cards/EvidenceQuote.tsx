import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquareQuote } from 'lucide-react'
import { logById } from '@/lib/data'
import { formatDate, formatTime } from '@/lib/format'
import type { Evidence } from '@/lib/types'

function Highlighted({ text, span }: { text: string; span?: [number, number] }) {
  if (!span) return <>{text}</>
  return (
    <>
      {text.slice(0, span[0])}
      <mark className="rounded bg-warn-bg px-0.5 text-warn-ink">{text.slice(span[0], span[1])}</mark>
      {text.slice(span[1])}
    </>
  )
}

/** 카드의 근거 한 건. 인용문을 먼저 보여주고, 펼치면 실제 대화 전체에서 그 부분을 강조한다. */
export default function EvidenceQuote({ evidence }: { evidence: Evidence }) {
  const [open, setOpen] = useState(false)
  const log = logById(evidence.log_id)
  const msg = log?.messages[evidence.message_index]
  if (!log || !msg) return null

  return (
    <div className="rounded-lg border-2 border-line-soft bg-surface">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <MessageSquareQuote size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-relaxed">“{evidence.quote}”</span>
          <span className="mt-0.5 block text-xs text-muted">
            {msg.speaker} · {formatDate(msg.sent_at)} {formatTime(msg.sent_at)} · {log.title}
          </span>
        </span>
        <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-xs font-medium text-brand">
          원문 보기
          {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </span>
      </button>
      {open && (
        <div className="border-t-2 border-line-soft bg-page px-3 py-3">
          <div className="mb-2 text-xs font-semibold text-muted">
            {log.source === 'slack' ? '슬랙' : '메모'} · {log.title}
          </div>
          <ul className="space-y-2">
            {log.messages.map((m, i) => (
              <li
                key={i}
                className={`rounded-md px-2.5 py-1.5 text-sm leading-relaxed ${
                  i === evidence.message_index ? 'border-2 border-line bg-surface' : ''
                }`}
              >
                <span className="font-semibold">{m.speaker}</span>
                <span className="ml-2 text-xs text-muted">{formatTime(m.sent_at)}</span>
                <p className="mt-0.5">
                  {i === evidence.message_index ? <Highlighted text={m.text} span={evidence.span} /> : m.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
