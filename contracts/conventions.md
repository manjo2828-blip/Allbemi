# 공통 규칙 (C0)

모든 계약 문서(`decision-card.schema.json`, `judgment.schema.json`, `api.md`)와 예시 데이터(`examples/`)에 공통으로 적용한다.
프론트엔드, 백엔드, 에이전트, 평가가 **같은 말을 하게 만드는 규칙**이다.

## 1. 표기 규칙

| 항목 | 규칙 | 예 |
|---|---|---|
| 필드 이름 | **영어 snake_case** | `decision`, `rejected_alternatives` |
| 값(enum) | **영어 소문자**. 화면에서 한국어·이모지로 변환 | `active`, `rejected` |
| 화면 문구 | 한국어. 데이터에는 넣지 않고 화면에서 enum을 매핑 | ✅ 일치 / ⚠ 충돌 / 🚫 기각된 안 / ➖ 관련 없음 |
| 날짜·시간 | **ISO 8601 UTC 문자열**. 화면에서만 로컬 시간으로 변환 | `2026-04-08T00:12:00Z` |
| ID | **접두사 + 소문자·숫자·밑줄** | `card_m01`, `log_m01`, `file_m03`, `proj_marketing`, `judg_m01` |
| 사람 | 목업 단계는 **이름 문자열**. 계정 연결은 백엔드(B2)에서 | `"김서윤"` |
| 빈 값 | 없는 배열은 `[]`, 없는 참조는 `null` (필드를 빼지 않는다) | `"superseded_by": null` |

## 2. 값 정의

### 카드 상태 `status`

| 값 | 화면 | 의미 | 조건 |
|---|---|---|---|
| `active` | 초록 | 현재 유효한 결정 | `superseded_by`는 `null` |
| `deprecated` | 회색 취소선 | 철회되어 더는 유효하지 않지만 **대체한 카드는 없음** | `superseded_by`는 `null` |
| `superseded` | 새 카드로 이어지는 화살표 | 새 결정으로 **대체됨** | `superseded_by`가 반드시 있음 |

### 판정 `verdict` (장면 ①)

| 값 | 화면 | 의미 |
|---|---|---|
| `match` | ✅ 일치 | 현재 유효한 결정과 같은 방향 |
| `conflict` | ⚠ 충돌 | 현재 유효한 결정과 반대 방향 |
| `rejected` | 🚫 기각된 안 | 과거에 검토 후 버렸거나 철회·대체된 안을 다시 꺼냄 |
| `unrelated` | ➖ 관련 없음 | 해당하는 카드 없음 |

**대표 판정 우선순위**: 한 계획이 여러 카드와 걸리면 가장 심각한 판정 하나를 대표로 한다.
`rejected` > `conflict` > `match` > `unrelated`. 근거 카드는 모두 `matched_cards`에 담는다.

### 근거 카드와의 관계 `relation`

| 값 | 의미 |
|---|---|
| `active_decision` | 현재 유효한 결정 |
| `rejected_alternative` | 카드의 `rejected_alternatives`에 적힌 버린 대안 |
| `deprecated_decision` | 철회된 결정 |
| `superseded_decision` | 새 결정으로 대체된 이전 결정 |

### 확신도 `confidence`

`high` / `medium` / `low` **3단계만** 쓴다. **퍼센트·점수는 쓰지 않는다** (LLM이 말하는 숫자는 신뢰하기 어렵고 화면에서 오해를 만든다).
`low`이면 `needs_review`는 반드시 `true` ("확인 필요" 표시).

### 출처 `origin`

| 값 | 의미 |
|---|---|
| `ai_extracted` | AI가 로그에서 추출 |
| `human_created` | 사람이 직접 작성 |
| `human_edited` | AI가 만든 것을 사람이 수정·확인 |

## 3. 무결성 규칙 (어기면 계약 위반)

1. **카드에는 근거가 반드시 있다**: `evidence`가 1개 이상이고, 각 근거의 `quote`는 해당 로그 메시지 원문에 **실제로 들어 있는 문자열**이어야 한다. 근거 없는 카드는 만들지 않는다.
2. **`status`는 LLM이 확정하지 않는다**: 상태 변경은 State Linker 규칙과 사람 확인으로 정한다.
3. **대체 관계는 양쪽이 일치한다**: A의 `superseded_by`가 B이면 B의 `supersedes`는 A다.
4. **판정에는 근거 카드가 있다**: `verdict`가 `unrelated`가 아니면 `matched_cards`가 1개 이상, `unrelated`이면 0개다. `rejected`이면 `rejected_reason`이 있다.
5. **첨부 파일 연결은 양쪽이 일치한다**: 카드의 `attachments[].file_id`와 파일의 `linked_card_ids`가 서로 맞는다.
6. **프로젝트가 섞이지 않는다**: 카드, 근거 로그, 첨부 파일은 같은 `project_id`에 속한다.

## 4. 예시 데이터 규칙

- 예시 데이터는 **`contracts/examples/` 한 곳에만** 둔다. 프론트(가짜 API), 백엔드(시드), 평가(정답 데이터 씨앗)가 같은 파일을 쓴다.
- **합성 데이터만** 쓴다. 실제 회사·사람·자료를 쓰지 않는다 (공개 저장소).
- 예시를 고치면 `scripts/validate_examples.py`를 실행해 통과시킨다.
