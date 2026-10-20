import projectsJson from '@contracts/examples/projects.json'
import cardsJson from '@contracts/examples/cards.json'
import logsJson from '@contracts/examples/logs.json'
import filesJson from '@contracts/examples/files.json'
import judgmentsJson from '@contracts/examples/judgments.json'
import usersJson from '@contracts/examples/users.json'
import handoversJson from '@contracts/examples/handovers.json'
import type { AttachedFile, CardKind, DecisionCard, Handover, Judgment, Log, Project, User } from './types'

// F1~F9: contracts/examples 의 예시 데이터를 직접 읽는다. F9에서 가짜 API(MSW) 계층으로 대체한다.
export const projects = projectsJson as Project[]
export const cards = cardsJson as unknown as DecisionCard[]
export const logs = logsJson as Log[]
export const files = filesJson as AttachedFile[]
export const judgments = judgmentsJson as Judgment[]
export const users = usersJson as User[]
export const handovers = handoversJson as Handover[]

const cardMap = new Map(cards.map((c) => [c.id, c]))
const logMap = new Map(logs.map((l) => [l.id, l]))
const fileMap = new Map(files.map((f) => [f.id, f]))

export const cardById = (id: string) => cardMap.get(id)
export const logById = (id: string) => logMap.get(id)
export const fileById = (id: string) => fileMap.get(id)
export const userById = (id: string) => users.find((u) => u.id === id)

/** 프로젝트는 고르는 단위가 아니라 카드의 이름표다. 아직 정해지지 않았으면 빈 문자열. */
export const projectName = (id: string) => (id ? (projects.find((p) => p.id === id)?.name ?? id) : '프로젝트 미정')

// ---- 목업 임시 저장소 (F6) ----
// 기록하기로 만든 로그·카드·파일을 메모리에만 더한다. 새로고침하면 사라진다. 실제 저장은 백엔드(B3·B4·B5)가 한다.
export function saveEntry(entry: { log: Log; cards: DecisionCard[]; files: AttachedFile[] }) {
  logs.push(entry.log)
  logMap.set(entry.log.id, entry.log)
  for (const c of entry.cards) {
    cards.push(c)
    cardMap.set(c.id, c)
  }
  for (const f of entry.files) {
    files.push(f)
    fileMap.set(f.id, f)
  }
}

/** 파일을 카드에 연결한다 (양쪽 기록을 함께 갱신한다 — conventions 무결성 규칙 5). */
export function linkFileToCard(fileId: string, cardId: string, note: string) {
  const f = fileMap.get(fileId)
  const c = cardMap.get(cardId)
  if (!f || !c || f.linked_card_ids.includes(cardId)) return
  f.linked_card_ids.push(cardId)
  c.attachments.push({ file_id: fileId, note })
}

/** 프로젝트가 정해지지 않은 카드·파일에 프로젝트를 지정한다. */
export function assignProject(cardIds: string[], fileIds: string[], projectId: string) {
  for (const id of cardIds) {
    const c = cardMap.get(id)
    if (c) {
      c.project_id = projectId
      c.needs_review = c.confidence === 'low'
    }
  }
  for (const id of fileIds) {
    const f = fileMap.get(id)
    if (f) f.project_id = projectId
  }
}

export const cardsOfKind = (kind: CardKind) => cards.filter((c) => c.kind === kind)

/** 자료 화면: 연결된 카드의 종류로 나눈다. 어느 카드에도 연결 안 된 파일은 내 업무 쪽에 둔다. */
export const filesOfKind = (kind: CardKind) =>
  files.filter((f) => {
    const kinds = f.linked_card_ids.map((id) => cardMap.get(id)?.kind)
    return kinds.length === 0 ? kind === 'work' : kinds.includes(kind)
  })

/** 카드 화면 경로. 내 업무 / 인수인계 영역은 카드 종류로 정해진다. */
export const cardPath = (card: Pick<DecisionCard, 'id' | 'kind'>) =>
  `/${card.kind === 'work' ? 'work' : 'handover'}/deck/${card.id}`

/** 이 카드가 반영되어 만들어진 인수인계 카드 */
export const handoverCardsFrom = (cardId: string) =>
  cards.filter((c) => c.kind === 'handover' && c.source_card_ids.includes(cardId))

/** 대체 관계의 전체 체인(가장 오래된 것 → 가장 새 것) */
export function supersedeChain(card: DecisionCard): DecisionCard[] {
  const chain = [card]
  let cur: DecisionCard | undefined = card
  while (cur?.supersedes) {
    cur = cardMap.get(cur.supersedes)
    if (cur && !chain.includes(cur)) chain.unshift(cur)
    else break
  }
  cur = card
  while (cur?.superseded_by) {
    cur = cardMap.get(cur.superseded_by)
    if (cur && !chain.includes(cur)) chain.push(cur)
    else break
  }
  return chain
}
