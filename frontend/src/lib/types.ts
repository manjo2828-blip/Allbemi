// contracts/*.schema.json 의 형식 (F1 임시 최소판).
// F8(API 연결 계층)에서 스키마로부터 자동 생성한 타입으로 교체한다.

export type CardStatus = 'active' | 'deprecated' | 'superseded'
export type Verdict = 'match' | 'conflict' | 'rejected' | 'unrelated'
export type Confidence = 'high' | 'medium' | 'low'
export type Relation = 'active_decision' | 'rejected_alternative' | 'deprecated_decision' | 'superseded_decision'
export type Origin = 'ai_extracted' | 'ai_drafted' | 'human_created' | 'human_edited'
export type CardKind = 'work' | 'handover'
export type ProcessType = 'attempt' | 'failure' | 'blocker' | 'decision' | 'reversal'

export interface Project {
  id: string
  name: string
  description: string
  domain: 'marketing' | 'engineering'
  is_synthetic: boolean
}

export interface Evidence {
  log_id: string
  message_index: number
  quote: string
  span?: [number, number]
}

export interface ProcessStep {
  type: ProcessType
  text: string
  evidence?: Evidence
}

export interface DecisionCard {
  id: string
  project_id: string
  kind: CardKind
  topic: string
  decision: string
  rationale: string
  rejected_alternatives: { option: string; reason_rejected: string }[]
  owner: string
  decided_at: string
  status: CardStatus
  supersedes: string | null
  superseded_by: string | null
  confidence: Confidence
  needs_review: boolean
  origin: Origin
  evidence: Evidence[]
  attachments: { file_id: string; note: string }[]
  process: ProcessStep[]
  source_card_ids: string[]
}

export interface Log {
  id: string
  project_id: string
  source: 'slack' | 'memo'
  title: string
  occurred_at: string
  messages: { speaker: string; sent_at: string; text: string }[]
}

export interface AttachedFile {
  id: string
  project_id: string
  name: string
  mime_type: string
  size_bytes: number
  uploaded_by: string
  uploaded_at: string
  note: string
  linked_card_ids: string[]
  is_synthetic: boolean
}

export interface Judgment {
  id: string
  scope: 'all' | 'work' | 'handover'
  intent: { text: string; topic: string; proposed_option: string | null }
  verdict: Verdict
  matched_cards: { card_id: string; relation: Relation; evidence_quote: string }[]
  rejected_reason: string | null
  confidence: Confidence
  needs_review: boolean
  explanation: string
}

export interface User {
  id: string
  name: string
  title: string
  is_synthetic: boolean
}

export interface Handover {
  id: string
  from_user_id: string
  to_user_id: string
  scope: { project_ids: string[]; from: string; to: string }
  status: 'draft' | 'submitted' | 'in_review' | 'done'
  memo: string
  card_ids: string[]
  reviews: { card_id: string; state: 'understood' | 'question'; comment: string | null }[]
  created_at: string
  updated_at: string
}
