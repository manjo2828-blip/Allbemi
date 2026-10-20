# API 목록 (C3)

프론트엔드 ↔ 백엔드, 백엔드 ↔ 에이전트가 주고받는 요청·응답 형식.
**화면 A~D와 파일 첨부에 필요한 것만** 정했고, 나머지는 [선택]으로 표시했다.
객체의 형식은 `decision-card.schema.json`, `judgment.schema.json`, `log.schema.json`, `file.schema.json`, `project.schema.json`을 그대로 쓴다. 값의 정의는 `conventions.md` 참고.

## 0. 공통

| 항목 | 규칙 |
|---|---|
| 기본 경로 | `/api` (외부 공개 포트 8080 하나, nginx가 Backend로 전달) |
| 성공 응답 | `{ "data": <본문>, "meta": { ... } }` (`meta`는 없으면 `{}`) |
| 실패 응답 | `{ "error": { "code": "<코드>", "message": "<사람이 읽는 설명>" } }` + HTTP 상태 코드 |
| 목록 | 목업·초기에는 **페이지네이션 없이** 전체 반환 (카드가 수십 장). `meta.count`만 준다 |
| 인증 | 목업 단계는 고정 사용자. B2부터 `Authorization: Bearer <JWT>` |
| 시간 | ISO 8601 UTC 문자열 |
| 변경 불가 필드 | `id`, `project_id`, `origin`, `evidence`는 사용자가 PATCH로 바꿀 수 없다 |

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

| 화면 | 사용하는 API |
|---|---|
| **A** 카드 덱 목록·상세 | 2-1, 2-2, 2-3, 2-4 |
| **B** 장면 ① 계획 비교 | 3-1 |
| **C** 로그 붙여넣기 + 파일 드롭존 | 4-1 (연결 확인·수정은 4-2) |
| **D** 상태 시각화 | 2-2, 2-3 응답의 `superseded_by`·`supersedes`로 충분 (별도 API 없음) |
| 카드 수정·확인, 카드에서 자료 추가 (방법 B) | 5-1, 5-2, 5-3, 5-4 |
| [선택] E·F·G | 6장 |

## 2. 조회 (화면 A, D)

### 2-1. 프로젝트 목록
`GET /api/projects`
→ `data`: `Project[]` · `meta.count`

### 2-2. 카드 목록 (덱)
`GET /api/projects/{project_id}/cards`
쿼리(선택): `status=active|deprecated|superseded` · `needs_review=true` · `topic=<topic>`
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
{ "project_id": "proj_marketing", "text": "메가 인플루언서 한 명 섭외해 볼까" }
```
→ `data`: **`Judgment`** (`contracts/examples/judgments.json` 참고)
- `verdict`가 `rejected`이면 `rejected_reason`이 있고, `matched_cards`에 근거 카드가 들어 있다.
- 처리 시간이 걸릴 수 있다. 목업·초기에는 **일반 요청-응답**이고 스트리밍(SSE)은 [선택]이다.

## 4. 기록과 파일 (화면 C, 방법 A)

### 4-1. 기록 한 묶음 올리기 (로그 + 파일)
`POST /api/entries` — `multipart/form-data`

| 필드 | 설명 |
|---|---|
| `project_id` | 대상 프로젝트 |
| `text` | 붙여넣은 로그·메모 (텍스트). 슬랙 export(JSON)도 허용 |
| `files[]` | 첨부 파일 0개 이상 (선택) |
| `file_notes[]` | 파일별 한 줄 메모 (선택, `files[]`와 같은 순서) |

→ `data`:
```json
{
  "entry_id": "entry_001",
  "log": { "...": "Log" },
  "cards": [ { "...": "DecisionCard (origin=ai_extracted)" } ],
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
`GET /api/projects/{project_id}/files` → `data`: `AttachedFile[]` (덱의 "자료" 탭)

## 6. [선택] 화면 E·F·G (필요해질 때 상세 정의)

| API | 용도 |
|---|---|
| `POST /api/handover/audit` | 인수인계 점검: 양식에 반영되지 않은 카드(빈 자리), 내용이 다른 항목, 연결 안 된 파일, 완성도 |
| `POST /api/cards/{card_id}/ack` | 확인 모드: `{ "state": "understood" \| "question" }` |
| `POST /api/ask` | 카드 기반 질문: 답변 + 인용 카드, 근거 없으면 `answer: null` ("기록에 없음") |

## 7. 내부 API (Backend → AI Agent)

Backend만 에이전트를 호출한다 (호출 방향은 한 방향).

`POST /v1/run`
```json
{ "task": "judge", "project_id": "proj_marketing", "payload": { "text": "..." } }
```

| `task` | `payload` | 응답 `data` |
|---|---|---|
| `judge` | `{ "text": "..." }` | **`Judgment`** (3-1과 동일) |
| `extract` | `{ "log": Log, "files": AttachedFile[] }` | `{ "cards": DecisionCard[], "file_links": [...] }` (4-1의 일부) |
| `audit` [선택] | 양식과 프로젝트 카드 | 점검 결과 |
| `ask` [선택] | `{ "question": "..." }` | 인용 답변 |

- **판정·카드 생성 문장은 에이전트에서만 만든다.** Backend와 Frontend는 `verdict`, `status`, 설명 문장을 만들거나 바꾸지 않는다.
- 에이전트가 `memory` 스키마에 쓰는 결과(카드, 판정)는 Backend가 읽기 전용으로 조회한다.
- **가짜 에이전트(B6)** 는 이 형식 그대로 `contracts/examples/judgments.json`의 판정을 돌려준다.

## 8. 예시 데이터

모든 요청·응답 예시는 `contracts/examples/`의 파일과 같은 형식이다. 프론트(가짜 API), 백엔드(시드), 평가(정답 데이터 씨앗)가 같은 파일을 쓴다.
`py scripts/validate_examples.py`로 스키마와 무결성(인용문이 원문에 있는지, 대체·첨부 관계가 양쪽 일치하는지 등)을 검사한다.
