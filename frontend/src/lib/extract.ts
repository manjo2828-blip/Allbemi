import { cards as allCards, projects } from './data'
import type { AttachedFile, Confidence, DecisionCard, Log, ProcessStep, ProcessType } from './types'

// F6 임시 가짜 추출기. 실제 추출은 에이전트(AG3 Extractor)가 한다.
// 목업이 화면 흐름(붙여넣기 → 카드 뒤집힘 → 파일 연결)을 보여 줄 수 있도록 문장 속 표현(확정·검토했는데·뺐습니다 등)만 단순 규칙으로 본다.
// F9에서 MSW 가짜 API(/api/entries)로 옮기고, 이후 백엔드와 에이전트로 교체한다.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const sampleLogs = [
  {
    label: '캐시 저장소 정하기',
    text: [
      '박민준: 세션 캐시는 Redis로 가려고 합니다. 이미 팀에서 써본 경험이 있어요.',
      '정우진: Memcached도 검토했는데 데이터 구조가 단순해서 이점이 작아요.',
      '정우진: 세션 캐시는 Redis로 확정하죠.',
    ].join('\n'),
  },
  {
    label: '런칭 주 사은품',
    text: '김서윤: 런칭 주 사은품은 텀블러로 정합니다. 에코백도 검토했는데 단가가 비싸서 뺐습니다.',
  },
]

const DECISION = /(확정|기로 (했|합니다|함|결정)|으?로 (정합니다|정했|결정|가죠|갑시다|갑니다|하죠|합시다|받죠|쓰죠|가겠습니다)|그렇게 (가죠|하죠))/
const REVERSAL = /(바꾸기로|변경하기로|번복|다시 .*기로)/
const BLOCKER = /(이슈|막혔|막혀|문제가 (있|생))/
const FAILURE = /(뺐|제외|안 맞|부담이|이점이 (작|적)|기각|포기|별로|비싸)/
const ATTEMPT = /(검토|해봤|시도|테스트|비교해|가려고|하려고|제안)/
const REASON = /(때문|해서|라서|이유|경험|부담|피로|해지|줄이|위해|높아서|커서|단순)/

const TOPICS: [RegExp, string][] = [
  [/(캐시|Redis|레디스)/i, 'cache_strategy'],
  [/(저장소|DB|데이터베이스)/i, 'log_storage'],
  [/(검색)/, 'search_engine'],
  [/(배포)/, 'deploy_cadence'],
  [/(알림)/, 'alert_channel'],
  [/(인증|JWT)/i, 'api_auth'],
  [/(보관)/, 'log_retention'],
  [/(릴스|채널)/, 'main_channel'],
  [/(쿠폰|사은품)/, 'promotion_coupon'],
  [/(슬로건)/, 'slogan'],
  [/(런칭일)/, 'launch_date'],
  [/(예산)/, 'ad_budget'],
  [/(뉴스레터)/, 'newsletter_frequency'],
]

const PROJECT_WORDS: Record<string, RegExp> = {
  proj_dev: /(서버|DB|로그|배포|API|저장소|캐시|검색|Redis|PostgreSQL|인증|알림|인덱스)/i,
  proj_marketing: /(인스타|릴스|캠페인|인플루언서|런칭|쿠폰|사은품|슬로건|뉴스레터|광고|예산|콘텐츠)/,
}

interface Sentence {
  msg: number
  text: string
}

function parseMessages(text: string, owner: string, now: string): Log['messages'] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^\[?(?:\d{1,2}:\d{2})?\]?\s*([가-힣A-Za-z0-9_]{2,10})\s*[:：]\s*(.+)$/)
      return m ? { speaker: m[1], sent_at: now, text: m[2] } : { speaker: owner, sent_at: now, text: line }
    })
}

function splitSentences(messages: Log['messages']): Sentence[] {
  return messages.flatMap((m, i) =>
    m.text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim().replace(/[.!?]+$/, ''))
      .filter((s) => s.length >= 4)
      .map((s) => ({ msg: i, text: s })),
  )
}

function classify(s: string): ProcessType | 'reason' | null {
  if (REVERSAL.test(s)) return 'reversal'
  if (DECISION.test(s)) return 'decision'
  if (BLOCKER.test(s)) return 'blocker'
  if (FAILURE.test(s)) return 'failure'
  if (ATTEMPT.test(s)) return 'attempt'
  if (REASON.test(s)) return 'reason'
  return null
}

/** "Memcached도 검토했는데 …", "틱톡은 … 뺐습니다" 같은 문장에서 버린 대안과 이유를 뽑는다. */
function rejectedFrom(s: string): { option: string; reason_rejected: string } | null {
  const m = s.match(/^(.{2,20}?)(?:도|은|는)\s+(.+)$/)
  if (!m) return null
  const rest = m[2].replace(/^검토했(?:는데|지만|으나)\s*/, '')
  if (!rest || !(FAILURE.test(s) || /검토/.test(s))) return null
  return { option: m[1].trim(), reason_rejected: rest }
}

const topicOf = (s: string) => TOPICS.find(([re]) => re.test(s))?.[1] ?? 'unclassified'

export function guessProject(text: string): string | null {
  const score = Object.entries(PROJECT_WORDS).map(([id, re]) => [id, (text.match(new RegExp(re, 'gi')) ?? []).length] as const)
  score.sort((a, b) => b[1] - a[1])
  return score[0][1] > 0 && score[0][1] > (score[1]?.[1] ?? 0) ? score[0][0] : null
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export interface FileLink {
  file_id: string
  /** suggested = 같은 묶음이라 자동 제안, needs_review = 연결 확인 필요 */
  link_status: 'suggested' | 'needs_review'
  card_id: string | null
}

export interface EntryResult {
  log: Log
  cards: DecisionCard[]
  files: AttachedFile[]
  file_links: FileLink[]
  /** 프로젝트를 사용자가 고르지 않았고 추정도 못 했으면 true */
  project_unknown: boolean
  /** 같은 주제의 기존 카드가 있는 새 카드 → 기존 카드 */
  same_topic: Record<string, DecisionCard>
}

export async function createEntry(input: {
  text: string
  files: File[]
  projectId: string | 'auto'
  owner: string
}): Promise<EntryResult> {
  await sleep(1400)

  const stamp = Date.now()
  const nowIso = new Date().toISOString()
  const messages = parseMessages(input.text, input.owner, nowIso)
  const log: Log = {
    id: `log_new_${stamp}`,
    project_id: '',
    source: 'memo',
    title: '내가 붙여넣은 기록',
    occurred_at: nowIso,
    messages,
  }

  const projectId = input.projectId !== 'auto' ? input.projectId : (guessProject(input.text) ?? '')
  log.project_id = projectId

  // 문장 순서대로 훑으면서 결정 문장을 만날 때마다 카드 하나를 만든다.
  const sentences = splitSentences(messages)
  const cards: DecisionCard[] = []
  let buf: { type: ProcessType | 'reason'; s: Sentence }[] = []

  const finish = (decision: Sentence | null, extra: typeof buf = []) => {
    const all = [...buf, ...extra]
    const steps = all.filter((b) => b.type !== 'reason')
    const target = decision
    if (!target && cards.length > 0) {
      // 마지막 결정 뒤에 이어진 문장은 마지막 카드의 과정으로 붙인다.
      const last = cards[cards.length - 1]
      const add = steps.map(toStep)
      last.process.splice(last.process.length - 1, 0, ...add)
      for (const b of all) addRejected(last, b.s.text)
      if (last.confidence === 'low' && last.rejected_alternatives.length > 0) {
        // 결정 뒤에 이어진 문장에서 이유를 찾은 경우
        const why = all.find((b) => rejectedFrom(b.s.text))
        last.rationale = last.rejected_alternatives[0].reason_rejected
        last.confidence = 'high'
        last.needs_review = projectId === ''
        if (why) last.evidence.push({ log_id: log.id, message_index: why.s.msg, quote: why.s.text })
      }
      return
    }
    if (!target) return
    const reasonSentence = all.find((b) => b.type === 'reason')?.s ?? null
    const rejected = all.flatMap((b) => {
      const r = b.type === 'failure' || b.type === 'attempt' ? rejectedFrom(b.s.text) : null
      return r ? [r] : []
    })
    const failureReason = rejected[0]?.reason_rejected
    const rationale = reasonSentence?.text ?? failureReason ?? null
    const confidence: Confidence = rationale ? (rejected.length > 0 ? 'high' : 'medium') : 'low'
    const evidence = [{ log_id: log.id, message_index: target.msg, quote: target.text }]
    if (reasonSentence) evidence.push({ log_id: log.id, message_index: reasonSentence.msg, quote: reasonSentence.text })

    cards.push({
      id: `card_new_${stamp}_${cards.length + 1}`,
      project_id: projectId,
      kind: 'work',
      topic: topicOf(target.text),
      decision: target.text,
      rationale: rationale ?? '근거 언급이 없음 (확인 필요)',
      rejected_alternatives: rejected,
      owner: input.owner,
      decided_at: nowIso,
      status: 'active',
      supersedes: null,
      superseded_by: null,
      confidence,
      needs_review: confidence === 'low' || projectId === '',
      origin: 'ai_extracted',
      evidence,
      attachments: [],
      process: [...steps.map(toStep), toStep({ type: classify(target.text) as ProcessType, s: target })],
      source_card_ids: [],
    })
  }

  const toStep = (b: { type: ProcessType | 'reason'; s: Sentence }): ProcessStep => ({
    type: b.type as ProcessType,
    text: b.s.text,
    evidence: { log_id: log.id, message_index: b.s.msg, quote: b.s.text },
  })
  const addRejected = (card: DecisionCard, text: string) => {
    const r = rejectedFrom(text)
    if (r && !card.rejected_alternatives.some((x) => x.option === r.option)) card.rejected_alternatives.push(r)
  }

  for (const s of sentences) {
    const type = classify(s.text)
    if (type === 'decision' || type === 'reversal') {
      finish(s)
      buf = []
    } else if (type) {
      buf.push({ type, s })
    }
  }
  finish(null)

  // 같은 주제의 기존 카드가 있으면 확인이 필요하다 (대체 관계는 State Linker가 판단한다)
  const same_topic: Record<string, DecisionCard> = {}
  for (const c of cards) {
    const prev = allCards.find((x) => x.kind === 'work' && x.status === 'active' && x.topic === c.topic && c.topic !== 'unclassified')
    if (prev) {
      same_topic[c.id] = prev
      c.needs_review = true
    }
  }

  // 파일: 카드가 하나면 같은 묶음이므로 그 카드에 연결 후보로 붙이고, 여럿이면 파일명이 맞는 카드, 아니면 "연결 확인 필요"
  const files: AttachedFile[] = input.files.map((f, i) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    return {
      id: `file_new_${stamp}_${i + 1}`,
      project_id: projectId,
      name: f.name,
      mime_type: f.type || MIME_BY_EXT[ext] || 'application/octet-stream',
      size_bytes: f.size,
      uploaded_by: input.owner,
      uploaded_at: nowIso,
      note: '기록하기에서 함께 올린 자료',
      linked_card_ids: [],
      is_synthetic: true,
    }
  })
  const file_links: FileLink[] = files.map((f) => {
    if (cards.length === 1) return { file_id: f.id, link_status: 'suggested', card_id: cards[0].id }
    const tokens = f.name.replace(/\.[^.]+$/, '').split(/[_\-\s.]+/).filter((t) => t.length >= 2)
    const hit = cards.find((c) => tokens.some((t) => c.decision.includes(t) || c.topic.includes(t.toLowerCase())))
    return hit
      ? { file_id: f.id, link_status: 'suggested', card_id: hit.id }
      : { file_id: f.id, link_status: 'needs_review', card_id: null }
  })
  for (const l of file_links) {
    if (!l.card_id) continue
    const c = cards.find((x) => x.id === l.card_id)!
    const f = files.find((x) => x.id === l.file_id)!
    f.linked_card_ids.push(c.id)
    c.attachments.push({ file_id: f.id, note: '같은 기록과 함께 올린 자료' })
  }

  return { log, cards, files, file_links, project_unknown: projectId === '', same_topic }
}

export const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))
