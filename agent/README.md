# agent

LangGraph 멀티 에이전트 서비스. Supervisor가 4개 흐름으로 분기한다.

- 기록: Extractor → State Linker → Confidence Gate
- 판정: Intent Parser → Retriever → Judge → Verifier
- 점검: Gap Auditor / 확인: Question Drafter
- Grounded QA: 근거 없으면 거부

`memory` 스키마에 **쓰는 유일한 서비스**. 라벨: `to-agent`
