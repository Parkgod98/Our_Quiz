# Our Quiz Portable Question Format

## 목표

ChatGPT, Claude 또는 사람이 만든 문제를 특정 AI 서비스에 종속되지 않는 JSON 파일로 주고받습니다.

현재 Schema Version은 `1.0`입니다.

## Question Set

```json
{
  "schemaVersion": "1.0",
  "setId": "week1-dram",
  "title": "Week 1 - 반도체와 DRAM",
  "subject": "Semiconductor",
  "week": 1,
  "version": 1,
  "description": "S1/S2 전체 점검",
  "questions": []
}
```

### 규칙

- `setId`: 영문 소문자/숫자/kebab-case
- `version`: 1 이상의 정수
- `questions[].id`: 같은 Version 안에서 유일
- `topic`: `DRAM.Timing.tRCD`처럼 점(`.`)으로 계층을 표현
- `difficulty`: 1~5
- 정답과 해설은 필수

## 지원 Question Type

### single_choice

```json
{
  "id": "dram-s2-001",
  "type": "single_choice",
  "topic": "DRAM.Refresh",
  "difficulty": 2,
  "prompt": "DRAM에 Refresh가 필요한 가장 직접적인 이유는?",
  "choices": [
    { "id": "a", "text": "Capacitor의 전하가 누설되기 때문에" },
    { "id": "b", "text": "CPU Cache와 동기화하기 위해" }
  ],
  "answer": "a",
  "explanation": "DRAM은 Capacitor 전하로 데이터를 표현하며 전하는 시간이 지나며 누설된다."
}
```

### multiple_choice

`answer`는 정답 choice ID 배열입니다. 순서는 의미가 없습니다.

```json
{
  "id": "dram-s2-002",
  "type": "multiple_choice",
  "topic": "DRAM.Hierarchy",
  "difficulty": 3,
  "prompt": "DRAM 접근 비용에 영향을 줄 수 있는 것을 모두 고르시오.",
  "choices": [
    { "id": "a", "text": "Row Buffer 상태" },
    { "id": "b", "text": "Refresh" },
    { "id": "c", "text": "소스 코드 파일명" }
  ],
  "answer": ["a", "b"],
  "explanation": "Row 상태와 Refresh는 실제 DRAM 스케줄링/접근 지연에 영향을 줄 수 있다."
}
```

### true_false

```json
{
  "id": "dram-s2-003",
  "type": "true_false",
  "topic": "DRAM.SRAM",
  "difficulty": 1,
  "prompt": "SRAM은 Refresh가 없으므로 비휘발성 메모리다.",
  "answer": false,
  "explanation": "SRAM도 전원이 끊기면 데이터가 사라지는 휘발성 메모리다."
}
```

### short_answer

`answer`는 허용할 정답 문자열 배열입니다. 기본 채점은 앞뒤 공백 제거 + 소문자 변환 후 완전 일치입니다.

```json
{
  "id": "dram-s2-004",
  "type": "short_answer",
  "topic": "DRAM.Timing",
  "difficulty": 2,
  "prompt": "ACTIVATE 후 READ/WRITE 명령까지의 대표 Timing은?",
  "answer": ["tRCD", "trcd"],
  "explanation": "tRCD는 Row 활성화 후 Column 명령을 낼 수 있을 때까지의 지연이다."
}
```

### ordering

`items`를 화면에 섞어 보여주고 `answer`에 올바른 ID 순서를 기록합니다.

```json
{
  "id": "dram-s2-005",
  "type": "ordering",
  "topic": "DRAM.Command",
  "difficulty": 3,
  "prompt": "같은 Bank의 다른 Row로 이동할 때 대표 순서를 배열하시오.",
  "items": [
    { "id": "pre", "text": "PRECHARGE" },
    { "id": "act", "text": "ACTIVATE" },
    { "id": "read", "text": "READ" }
  ],
  "answer": ["pre", "act", "read"],
  "explanation": "열린 Row를 닫고 새 Row를 활성화한 뒤 Column을 읽는다."
}
```

## Validation 원칙

Validator는 아래를 거부합니다.

- 지원하지 않는 `schemaVersion`
- 중복 Question ID
- 빈 문제/해설
- 허용 범위 밖 difficulty
- 선택지에 없는 choice를 정답으로 지정
- ordering item에 없는 ID를 정답에 지정
- 질문 Type에 맞지 않는 Answer 자료형

Validator는 정답을 추측해서 고쳐주지 않습니다.
