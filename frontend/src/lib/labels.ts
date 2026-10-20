import {
  Archive,
  Ban,
  Check,
  CircleCheck,
  CircleX,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  GitMerge,
  Lightbulb,
  Minus,
  OctagonAlert,
  Presentation,
  TriangleAlert,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import type { CardKind, CardStatus, Confidence, Origin, ProcessType, Relation, Verdict } from './types'

// 데이터에는 영어 enum만 두고, 화면 문구·아이콘·색은 여기서만 매핑한다 (contracts/conventions.md).

export const statusMeta: Record<CardStatus, { label: string; icon: LucideIcon; cls: string; bar: string }> = {
  active: { label: '유효', icon: Check, cls: 'bg-active-bg text-active-ink border-active', bar: 'bg-active' },
  superseded: { label: '대체됨', icon: GitMerge, cls: 'bg-superseded-bg text-superseded-ink border-superseded', bar: 'bg-superseded' },
  deprecated: { label: '철회', icon: Archive, cls: 'bg-neutral-bg text-neutral-ink border-neutral', bar: 'bg-neutral' },
}

export const verdictMeta: Record<Verdict, { label: string; icon: LucideIcon; cls: string; desc: string }> = {
  match: { label: '일치', icon: Check, cls: 'bg-active-bg text-active-ink border-active', desc: '현재 유효한 결정과 같은 방향이에요.' },
  conflict: { label: '충돌', icon: TriangleAlert, cls: 'bg-warn-bg text-warn-ink border-warn', desc: '현재 유효한 결정과 다른 방향이에요.' },
  rejected: { label: '기각된 안', icon: Ban, cls: 'bg-rejected-bg text-rejected-ink border-rejected', desc: '이미 검토하고 버린 안이에요.' },
  unrelated: { label: '관련 없음', icon: Minus, cls: 'bg-neutral-bg text-neutral-ink border-neutral', desc: '관련된 결정 카드가 없어요.' },
}

export const relationMeta: Record<Relation, string> = {
  active_decision: '현재 유효한 결정',
  rejected_alternative: '버려진 대안',
  deprecated_decision: '철회된 결정',
  superseded_decision: '대체된 이전 결정',
}

export const confidenceMeta: Record<Confidence, string> = {
  high: '확신 높음',
  medium: '확신 보통',
  low: '확신 낮음',
}

/** 카드 종류: 내 업무(업무 기록 카드) / 인수인계(인수인계 카드) */
export const kindMeta: Record<CardKind, { label: string; short: string; cls: string }> = {
  work: { label: '업무 기록 카드', short: '내 기록', cls: 'border-line-soft bg-page text-ink' },
  handover: { label: '인수인계 카드', short: '인수인계', cls: 'border-brand bg-selected/60 text-brand' },
}

/** 과정 타임라인의 단계 유형 */
export const processMeta: Record<ProcessType, { label: string; icon: LucideIcon; cls: string }> = {
  attempt: { label: '시도', icon: Lightbulb, cls: 'border-line-soft bg-page text-ink' },
  failure: { label: '실패·기각', icon: CircleX, cls: 'border-rejected bg-rejected-bg text-rejected-ink' },
  blocker: { label: '막힘', icon: OctagonAlert, cls: 'border-warn bg-warn-bg text-warn-ink' },
  decision: { label: '결정', icon: CircleCheck, cls: 'border-active bg-active-bg text-active-ink' },
  reversal: { label: '번복', icon: Undo2, cls: 'border-superseded bg-superseded-bg text-superseded-ink' },
}

export const originMeta: Record<Origin, string> = {
  ai_extracted: 'AI가 추출',
  ai_drafted: 'AI가 초안 작성',
  human_created: '직접 작성',
  human_edited: '사람이 확인·수정',
}

export function fileIcon(mime: string): LucideIcon {
  if (mime.includes('pdf')) return FileText
  if (mime.includes('presentation')) return Presentation
  if (mime.includes('spreadsheet')) return FileSpreadsheet
  return FileIcon
}

export function fileKind(mime: string): string {
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('presentation')) return 'PPTX'
  if (mime.includes('spreadsheet')) return 'XLSX'
  return '파일'
}
