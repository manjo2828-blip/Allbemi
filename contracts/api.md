# API 목록 (C3)

프론트엔드 ↔ 백엔드, 백엔드 ↔ 에이전트가 주고받는 요청·응답 형식.
서비스는 **내 업무 기억**(업무 기록 카드)과 **인수인계**(인수인계 카드) 두 기능이고, 판단(계획 비교·질문)은 두 종류의 카드를 함께 쓴다. 프로젝트는 고르는 단위가 아니라 카드의 속성이다.
객체의 형식은 `decision-card.schema.json`, `judgment.schema.json`, `log.schema.json`, `file.schema.json`, `project.schema.json`, `user.schema.json`, `handover.schema.json`을 그대로 쓴다. 값의 정의는 `conventions.md` 참고.

## 0. 공통

| 항목 | 규칙 |
|---|---|
| 기본 경로 | `/api` (외부 공개 포트 8080 하나, nginx가 Backend로 전달) |
| 성공 응답 | `{ "data": <본문>, "meta": { ... } }` (`meta`는 없으면 `{}`) |
| 실패 응답 | `{ "error": { "code": "<코드>", "message": "<사람이 읽는 설명>" } }` + HTTP 상태 코드 |
| 목록 | 목업·초기에는 **페이지네이션 없이** 전체 반환 (카드가 수십 장). `meta.count`만 준다 |
| 인증 | 목업은 **데모 계정 입장**(0-1). B2부터 `Authorization: Bearer <JWT>` |
| 시간 | ISO 8601 UTC 문자열 |
| 변경 불가 필드 | `id`, `project_id`, `kind`, `origin`, `evidence`, `source_card_ids`는 사용자가 PATCH로 바꿀 수 없다 |
| 카드 종류 | 카드 목록·검색은 `kind=work|handover` 쿼리로 좁힌다. 생략하면 두 종류 모두 |

### 0-1. 로그인 (화면 로그인)

| API | 내용 |
|---|---|
| `POST /api/auth/demo` | 데모 체험 입장: 요청 본문 없이 호출하면 데모 사용자로 입장한다 (`user_id`는 선택) → `data`: `{ "token": "...", "user": User }`. 계정 입력 없이 한 번에 입장하는 버튼이 쓴다. 합성 데이터 전용 |
| `GET /api/me` | 현재 사용자 `User` (역할 없음. 인계자/후임자는 인수인계 목록의 `from_user_id` / `to_user_id`로 알 수 있다) |
| `POST /api/auth/logout` | 로그아웃 |

회원가입·비밀번호 찾기·소셜 로그인은 만들지 않는다. 실제 아이디/비밀번호 로그인(B2)은 이후 같은 `User` 형식으로 붙인다.

### 오류 코드

| code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 요청 형식이 계약과 다름 |
| `UNAUTHORIZED` | 401 | 로그인이 필요함 |
| `NOT_FOUND` | 404 | 대상이 없음 |
| `FILE_TOO_LARGE` | 413 | 파일 크기 제한 초과 (제한값은 `(TODO: 추후결정)`) |
| `UNSUPPORTED_FILE_TYPE` | 415 | 지원하지 않는 파일 형식 (PPTX·PDF 우선 검토, `(TODO: 추후결정)`) |
| `AGENT_TIMEOUT` | 504 | 에이전트 응답 시간 초과 |
| `AGENT_ERROR` | 502 | 에이전트 내부 오류 |

## 1. 화면 ↔ API 대응

| 화면 (메뉴) | 사용하는 API |
|---|---|
| 로그인 | 0-1 |
| **A** 카드 덱 목록·상세 (내 업무 / 인수인계 > 카드 덱) | 2-1, 2-2(`kind`로 구분), 2-3, 2-4 |
| **B** 장면 ① 계획 비교 (판단) | 3-1 |
| **C** 내 업무 기록하기 | 4-1 (연결 확인·수정은 4-2) |
| **D** 상태 시각화 | 2-2, 2-3 응답의 `superseded_by`·`supersedes`로 충분 (별도 API 없음) |
| **E** 인수인계 쓰기 (인수인계 > 기록하기) | 6-1, 6-2, 6-3 |
| 카드 수정·확인, 카드에서 자료 추가 (방법 B) | 5-1, 5-2, 5-3, 5-4 |
| **자료** (내 업무 / 인수인계 > 자료) | 5-4 (`kind`로 구분) |
| [선택] F 인수인계 점검, G 확인 모드, H 질문하기 | 6-4, 6-5, 6-6 |

## 2. 조회 (화면 A, D)

### 2-1. 프로젝트 목록
`GET /api/projects`
→ `data`: `Project[]` · `meta.count`

### 2-2. 카드 목록 (덱)
`GET /api/cards`
쿼리(선택): `kind=work|handover` · `project_id=<id>`(이름표 필터) · `status=active|deprecated|superseded` · `needs_review=true` · `topic=<topic>`
- 프로젝트를 고르지 않고 **모든 프로젝트의 카드를 기본으로 돌려준다.** 내 업무 화면은 `kind=work`, 인수인계 화면은 `kind=handover`로 호출한다.
→ `data`: `DecisionCard[]` (기본 정렬: `decided_at` 오름차순) · `meta.count`

### 2-3. 카드 상세
`GET /api/cards/{card_id}`
→ `data`: `DecisionCard`
응답만으로 "원문 보기"와 "첨부 자료"를 그릴 수 있도록 확장 조회를 지원한다.
`GET /api/cards/{card_id}?expand=evidence,attachments`
→ `data`: `DecisionCard` + `evidence_logs: Log[]`(근거로 쓰인 로그) + `attachment_files: AttachedFile[]`

### 2-4. 원문 로그
`GET /api/logs/{log_id}` → `data`: `Log`

## 3. 판정 (화면 B)

### 3-1. 계획 판정
`POST /api/judge`
```json
{ "text": "메가 인플루언서 한 명 섭외해 볼까", "scope": "all" }
```
`scope`는 `all`(기본, 두 종류 카드 모두) / `work` / `handover`. 프로젝트는 요청에 넣지 않는다.
→ `data`: **`Judgment`** (`contracts/examples/judgments.json` 참고)
- `verdict`가 `rejected`이면 `rejected_reason`이 있고, `matched_cards`에 근거 카드가 들어 있다.
- `matched_cards`에는 두 종류 카드가 섞일 수 있고, 화면은 카드의 `kind`로 "내 기록 / 인수인계" 라벨을 붙인다.
- 처리 시간이 걸릴 수 있다. 목업·초기에는 **일반 요청-응답**이고 스트리밍(SSE)은 [선택]이다.

## 4. 기록과 파일 (화면 C, 방법 A)

### 4-1. 기록 한 묶음 올리기 (로그 + 파일)
`POST /api/entries` — `multipart/form-data`

| 필드 | 설명 |
|---|---|
| `project_id` | (선택) 대상 프로젝트. 생략하면 에이전트가 내용으로 추정하고, 확신이 낮으면 카드가 `needs_review`가 된다 |
| `text` | 붙여넣은 로그·메모 (텍스트). 슬랙 export(JSON)도 허용 |
| `files[]` | 첨부 파일 0개 이상 (선택) |
| `file_notes[]` | 파일별 한 줄 메모 (선택, `files[]`와 같은 순서) |

→ `data`:
```json
{
  "entry_id": "entry_001",
  "log": { "...": "Log" },
  "cards": [ { "...": "DecisionCard (kind=work, origin=ai_extracted, process 포함)" } ],
  "file_links": [
    { "file_id": "file_m04", "card_id": "card_m12", "link_status": "suggested" },
    { "file_id": "file_m05", "card_id": null, "link_status": "needs_review" }
  ]
}
```
- **같은 묶음에서 만들어진 카드에 파일을 연결 후보로 붙인다.** 확신이 낮으면 `link_status: needs_review` ("연결 확인 필요")이고 `card_id`는 `null`일 수 있다.
- `link_status`: `suggested`(자동 제안) / `needs_review`(연결 확인 필요) / `confirmed`(사용자 확인)

### 4-2. 파일 연결 확인·변경
`PATCH /api/file-links` → 요청 `{ "file_id": "...", "card_id": "...", "link_status": "confirmed" }` → `data`: 갱신된 연결

## 5. 카드 수정과 자료 추가 (카드 확인, 방법 B)

### 5-1. 카드 수정·확인
`PATCH /api/cards/{card_id}`
수정 가능 필드: `decision`, `rationale`, `rejected_alternatives`, `owner`, `status`, `needs_review`
→ `data`: 갱신된 `DecisionCard` (서버가 `origin`을 `human_edited`로 바꾼다)
- `status`를 `superseded`로 바꿀 때는 `superseded_by`(대체한 카드)를 함께 보내야 한다.

### 5-2. 카드에 자료 추가
`POST /api/cards/{card_id}/files` — `multipart/form-data` (`file`, `note`)
→ `data`: `AttachedFile`

### 5-3. 카드에서 자료 연결 해제
`DELETE /api/cards/{card_id}/files/{file_id}` → 204 (파일 자체는 남고 연결만 끊는다)

### 5-4. 파일 정보·다운로드
`GET /api/files/{file_id}` → `data`: `AttachedFile`
`GET /api/files/{file_id}/download` → 파일 본문 (미리보기는 프론트가 처리)
`GET /api/files` → `data`: `AttachedFile[]` (자료 화면). 쿼리(선택): `kind=work|handover`(연결된 카드의 종류, 인수인계 자료는 `handover`), `project_id`, `orphan=true`(어느 카드에도 연결 안 된 파일)

## 6. 인수인계 (화면 E, [선택] F·G·H)

### 6-1. 인수인계 초안 만들기 (화면 E)
`POST /api/handovers`
```json
{ "to_user_id": "user_seoyeon", "scope": { "project_ids": ["proj_dev"], "from": "2026-03-01T00:00:00Z", "to": "2026-06-10T00:00:00Z" } }
```
→ `data`: `Handover`(`status=draft`) + `cards: DecisionCard[]` (**`kind=handover`, `origin=ai_drafted`**, 각 카드는 `source_card_ids`로 원본 업무 기록 카드를 가리킴)
- 에이전트의 Handover Drafter가 범위 안의 업무 기록 카드에서 초안을 만든다. 근거 없는 문장은 Verifier가 걸러 낸다.

### 6-1-1. 인수인계 목록
`GET /api/handovers?direction=sent|received` → `data`: `Handover[]` (`sent`=내가 넘기는 것, `received`=내가 받은 것, 생략하면 둘 다). 같은 사람이 한 건은 넘기고 다른 한 건은 받을 수 있다.

### 6-2. 인수인계 조회·수정
`GET /api/handovers/{handover_id}` → `data`: `Handover` (+ `expand=cards`로 카드 포함)
`PATCH /api/handovers/{handover_id}` → 수정 가능: `memo`, `card_ids`, `status`(`draft` → `submitted`)
인수인계 카드 수정은 5-1(`PATCH /api/cards/{card_id}`)을 쓴다. 수정하면 `origin`이 `human_edited`가 된다.

### 6-3. 인계 완료
`POST /api/handovers/{handover_id}/submit` → `status=submitted`, 후임자의 인수인계 카드 덱에 나타난다.

### 6-4. [선택] 인수인계 점검 (화면 F)
`POST /api/handovers/{handover_id}/audit`
→ `data`: `{ "gaps": [...], "mismatches": [...], "unlinked_files": [...], "completeness": { "reflected": 5, "total": 6 } }`
- `gaps`: 인수인계 카드에 반영되지 않은 업무 기록 카드(빈 자리), `mismatches`: 내용이 다른 두 카드 쌍.

### 6-5. [선택] 확인 모드 (화면 G)
`PUT /api/handovers/{handover_id}/reviews/{card_id}` → 요청 `{ "state": "understood" | "question", "comment": "..." }`
`GET /api/handovers/{handover_id}/questions` → `question` 상태 카드와 질문 목록 (인계자용)

### 6-6. [선택] 카드 기반 질문 (화면 H)
`POST /api/ask` → 요청 `{ "question": "...", "scope": "all" }` → 답변 + 인용 카드, 근거 없으면 `answer: null` ("기록에 없음")

## 7. 내부 API (Backend → AI Agent)

Backend만 에이전트를 호출한다 (호출 방향은 한 방향).

`POST /v1/run`
```json
{ "task": "judge", "payload": { "text": "...", "scope": "all" } }
```

| `task` | `payload` | 응답 `data` |
|---|---|---|
| `judge` | `{ "text": "..." }` | **`Judgment`** (3-1과 동일) |
| `extract` | `{ "log": Log, "files": AttachedFile[], "project_id": string \| null }` | `{ "cards": DecisionCard[] (kind=work, process 포함), "file_links": [...] }` (4-1의 일부) |
| `draft_handover` | `{ "scope": {...}, "to_user_id": "..." }` | `{ "cards": DecisionCard[] (kind=handover) }` (6-1의 일부) |
| `audit` [선택] | `{ "handover_id": "..." }` | 점검 결과 (6-4와 동일) |
| `ask` [선택] | `{ "question": "...", "scope": "all" }` | 인용 답변 |

- **판정·카드 생성 문장은 에이전트에서만 만든다.** Backend와 Frontend는 `verdict`, `status`, 설명 문장을 만들거나 바꾸지 않는다.
- 에이전트가 `memory` 스키마에 쓰는 결과(카드, 판정)는 Backend가 읽기 전용으로 조회한다.
- **가짜 에이전트(B6)** 는 이 형식 그대로 `contracts/examples/judgments.json`의 판정을 돌려준다.

## 8. 예시 데이터

모든 요청·응답 예시는 `contracts/examples/`의 파일과 같은 형식이다. 프론트(가짜 API), 백엔드(시드), 평가(정답 데이터 씨앗)가 같은 파일을 쓴다.
`py scripts/validate_examples.py`로 스키마와 무결성(인용문이 원문에 있는지, 대체·첨부 관계가 양쪽 일치하는지 등)을 검사한다.
