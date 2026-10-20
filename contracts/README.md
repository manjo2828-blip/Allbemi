# contracts

서비스 간 유일한 약속. 계약 변경은 **계약 먼저, 구현은 그다음**.

| 문서 | 단계 | 내용 |
|---|---|---|
| [`conventions.md`](conventions.md) | C0 | 공통 규칙: 표기, 값(enum) 정의, 무결성 규칙 |
| [`decision-card.schema.json`](decision-card.schema.json) | **C1** | 결정 카드 형식 (결정 1개 = 카드 1장) |
| [`judgment.schema.json`](judgment.schema.json) | **C2** | 장면 ① 판정 결과 형식 |
| [`api.md`](api.md) | **C3** | API 목록 (화면 ↔ API 대응, 요청·응답, 오류 코드, 에이전트 내부 API) |
| [`examples/`](examples/) | **C4** | 예시 데이터 (프론트 가짜 API, 백엔드 시드, 평가 정답의 씨앗) |
| `log.schema.json` · `file.schema.json` · `project.schema.json` | | 카드가 참조하는 보조 형식 |

예정 문서: `agent-api.md`, `model-api.md`, `db-schema.sql` (백엔드·에이전트 단계에서 작성)

## 예시 데이터 (`examples/`)

합성 데이터만 쓴다. **마케팅팀(여름 신제품 런칭 캠페인)이 우선 시나리오**, 개발팀(로그 시스템 개편, MongoDB 시나리오)이 두 번째다.

| 파일 | 내용 |
|---|---|
| `projects.json` | 프로젝트 2개 (마케팅팀이 기본 선택) |
| `cards.json` | 결정 카드 18장 (마케팅 11, 개발 7): 상태 3종, 대체 관계 4쌍, 확인 필요 2장 |
| `logs.json` | 카드 근거가 되는 슬랙·메모 원문 19건 |
| `files.json` | 첨부 자료 5개 (파일 본체 없이 메타데이터만, 전부 합성) |
| `judgments.json` | 장면 ① 판정 예시 9개 (4종 판정 모두 포함) |

## 검증

```
pip install jsonschema
py scripts/validate_examples.py
```

스키마 검사에 더해 아래를 확인한다: 인용문이 원문에 실제로 있는지, 대체 관계와 첨부 연결이 양쪽에서 일치하는지, 프로젝트가 섞이지 않았는지, 판정이 카드 상태와 맞는지.
