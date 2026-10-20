import { cards, judgments } from './data'
import type { Judgment } from './types'

// F3 임시 가짜 판정. 실제 판정은 에이전트(AG4)가 한다.
//  1) contracts/examples/judgments.json 의 예시 문장과 같으면 그 판정을 돌려준다.
//  2) 아니면 입력에 "버려진 대안"의 이름이 들어 있는지만 단순 규칙으로 본다 (두 종류 카드 모두).
//  3) 그것도 없으면 관련 없음.
// F9에서 MSW 가짜 API로 옮기고, 이후 백엔드(/api/judge)로 교체한다.

const norm = (s: string) => s.replace(/[\s.,!?'"“”‘’~…]/g, '').toLowerCase()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function judge(text: string): Promise<Judgment> {
  await sleep(900)

  const preset = judgments.find((j) => norm(j.intent.text) === norm(text))
  if (preset) return preset

  // 같은 결정이 두 종류 카드에 있으면 인수인계 카드를 먼저 보여 준다
  const hits = cards
    .flatMap((c) =>
      c.rejected_alternatives
        .filter((a) => norm(text).includes(norm(a.option)))
        .map((a) => ({ card: c, alt: a })),
    )
    .sort((a, b) => (a.card.kind === b.card.kind ? 0 : a.card.kind === 'handover' ? -1 : 1))
  if (hits.length > 0) {
    const first = hits[0]
    return {
      id: `judg_mock_${Date.now()}`,
      scope: 'all',
      intent: { text, topic: first.card.topic, proposed_option: first.alt.option },
      verdict: 'rejected',
      matched_cards: hits.map(({ card, alt }) => ({
        card_id: card.id,
        relation: 'rejected_alternative',
        evidence_quote: `${alt.option}: ${alt.reason_rejected}`,
      })),
      rejected_reason: first.alt.reason_rejected,
      confidence: 'medium',
      needs_review: false,
      explanation: `"${first.alt.option}"은(는) 이전에 검토하고 버린 안으로 기록되어 있어요. (목업의 단순 규칙으로 찾은 결과예요.)`,
    }
  }

  return {
    id: `judg_mock_${Date.now()}`,
    scope: 'all',
    intent: { text, topic: 'unclassified', proposed_option: null },
    verdict: 'unrelated',
    matched_cards: [],
    rejected_reason: null,
    confidence: 'medium',
    needs_review: false,
    explanation: '예시 데이터에서 관련된 결정 카드를 찾지 못했어요. (목업은 예시 문장과 버려진 대안 이름만 알아봐요.)',
  }
}
