# Allbemi

업무 대화에서 결정 카드를 자동 생성하고, 새 계획을 기존 결정과 비교해 일치/충돌/기각된 안을 판정하는 멀티 에이전트 서비스.
이 문서는 **초안**이며 개발하면서 구체화한다. 미결 값은 임의로 채우지 않고 `(TODO: 추후결정)`으로 둔다.

## 구조 원칙
- 호출 방향: Frontend → Backend → Agent → Model Server. 역방향 호출 금지.
- DB 스키마마다 쓰기 주체는 1개 (`app` = Backend, `memory` = Agent). Backend는 `memory`를 읽기 전용으로만 접근.
- 판정 규칙·prompts는 `packs/work/`에서 로드한다. 엔진 코드에 하드코딩 금지.
- 서비스 간 형식은 `contracts/`가 유일한 약속이다. 계약 변경은 구현보다 먼저.

## 평가·데이터 (이 프로젝트의 핵심)
- `eval/sets/`, `eval/baselines/`는 수정하지 않는다. 학습 데이터와 평가 데이터를 섞지 않는다.
- 측정하지 않은 수치는 문서·README·이력서에 쓰지 않는다.
- 테스트에서 실제 LLM을 호출하지 않는다 (`LLM_FAKE=true`).

## 비밀값
- 키·토큰은 `.env`에만 둔다. `.env`는 커밋하지 않고 `.env.example`만 올린다.

## 폴더 소유권 (역할 라벨)
| 폴더 | 라벨 |
|---|---|
| `frontend/` | `to-frontend` |
| `backend/`, `libs/common/` | `to-backend` |
| `agent/`, `packs/work/` | `to-agent` |
| `model-server/`, `ml/` | `to-ml` |
| `eval/` | `to-eval` |
| `infra/`, `.github/`, `.claude/`, `docs/` | `to-infra` |

## 범위 등급
- **[필수]** 장면 ① (내 계획 vs 전임자 카드 + 판정 배지), 판정·추출 모델, 평가 실험표, 배포 링크
- **[선택]** 확인 모드, 완성도 게이지, 전환 효과
- **[이후]** 실시간 슬랙 연동, 권한 관리, 전사 통합 검색
