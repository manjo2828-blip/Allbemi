# Allbemi (올빼미)

> **모든(All) 업무 기록의 이유를 품는 올빼미.**
> 업무 대화·메모에서 **결정 카드**(결정 · 근거 · 버린 대안 · 상태)를 자동으로 만들고, 새 계획을 입력하면 기존 결정과 나란히 비교해 **일치 / 충돌 / 기각된 안**을 판정하며, 인수인계 때 빠진 결정을 찾아 주는 멀티 에이전트 서비스.

**차별점**: 하려는 일을 입력하면 *과거에 기각된 안인지* 먼저 알려 줍니다.

> 상태: **폴더 구조 기본 틀만 있는 초기 단계**입니다. 코드는 주차별로 채웁니다.

## 구조

| 폴더 | 역할 |
|---|---|
| `frontend/` | 카드 화면 (카드 비교, 상태 시각화, 완성도 게이지, 확인 모드) |
| `backend/` | API, 인증, 카드·양식 CRUD, 로그 업로드 |
| `agent/` | LangGraph 멀티 에이전트 (기록·판정·점검·확인 흐름) |
| `model-server/` | 직접 학습한 추출·판정 모델, 임베딩, 리랭커 서빙 |
| `packs/work/` | 결정 스키마 · 판정 규칙 · prompts (엔진과 분리된 도메인 설정) |
| `contracts/` | 서비스 간 유일한 약속 (API, DB, 결정 카드 형식) |
| `ml/` | 합성 데이터 생성, 모델 학습 (오프라인) |
| `eval/` | 평가 하네스, 지표, 기준선, 고정 평가 세트 |
| `data/` | 생성된 샘플·합성 데이터 |
| `libs/common/` | 공통 코드 |
| `infra/` | docker-compose, Dockerfile |
| `scripts/` | 로컬 실행·시드 스크립트 |
| `docs/` | 기획, 결정 기록, 구조도 |
| `.claude/`, `.github/` | 개발 자동화, CI |

구조도: [`docs/architecture/Allbemi_architecture.png`](docs/architecture/Allbemi_architecture.png)

## 구조 원칙

- 호출 방향은 한 방향: **Frontend → Backend → Agent → Model Server**
- DB 스키마마다 쓰기 주체는 하나 (`app` = Backend, `memory` = Agent)
- 판정 규칙·prompts는 엔진 코드에 하드코딩하지 않고 `packs/work/`에서 로드
- 평가 세트와 기준선은 학습 데이터와 분리하고 수정하지 않음
