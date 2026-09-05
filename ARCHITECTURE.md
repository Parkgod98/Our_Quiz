# Architecture

## 1. 목적

Our Quiz는 `문제 파일 ↔ 문제은행 ↔ 풀이 이력`을 분리해 관리합니다. 문제 내용이 바뀌어도 과거 점수가 바뀌지 않고, 두 스터디원이 같은 버전을 풀었다는 사실을 보존하는 것이 핵심입니다.

## 2. 주요 경계

```text
Browser
  │
  ├─ Next.js Page / Client Component
  │       │
  │       ├─ Question Import / Export
  │       └─ Quiz Player
  │
  └─ Next.js Route Handler
          │
          ├─ Runtime Question Validator
          ├─ Server-side Scoring
          └─ Supabase Server Client
                  │
                  └─ PostgreSQL + RLS
```

## 3. 핵심 도메인

### Question Set
사람이 이해하는 문제집의 논리적 묶음입니다. 제목, 과목, 주차 같은 지속되는 메타데이터를 가집니다.

### Question Set Version
실제로 시험에 사용되는 **불변 Snapshot**입니다. `v1`, `v2`처럼 증가합니다. 문제를 추가·수정하면 기존 Version을 수정하지 않고 새 Version을 만듭니다.

### Question
특정 Version에 귀속됩니다. Portable JSON의 `id`는 Version 내부에서 유일합니다.

### Study Group
두 명 이상이 동일한 Version을 공유하는 단위입니다.

### Attempt
사용자가 `Start`를 누른 순간 생성되는 한 번의 풀이 세션입니다. 반드시 특정 Version을 참조합니다.

### Attempt Answer
Attempt 내 개별 문제의 제출 답안과 채점 결과입니다.

## 4. 불변성 규칙

```text
Question Set
  ├─ Version 1 ─ Questions ─ Attempt A
  │                        └─ Attempt B
  │
  └─ Version 2 ─ Questions ─ Attempt C
```

Version 2가 생겨도 Attempt A/B는 Version 1 기준 점수를 유지합니다.

## 5. 권한 모델

- 인증: Supabase Auth
- 데이터 권한: PostgreSQL RLS
- 문제 세트 소유자는 새 Version을 만들 수 있습니다.
- 그룹 구성원은 그룹에 배정된 Version을 읽고 풀 수 있습니다.
- 사용자는 자신의 상세 답안을 읽을 수 있습니다.
- 그룹 구성원 간 비교는 Attempt의 점수/완료 정보처럼 공유가 필요한 범위로 제한합니다.

## 6. Question Import

```text
JSON Upload
→ Runtime Validation
→ Question Set 생성 또는 새 Version 선택
→ Version Snapshot 저장
→ Questions 정규화 저장
→ Publish
```

원본 JSON도 Version에 `source_json`으로 보존해 그대로 Export할 수 있게 합니다.

## 7. 채점

Client는 선택 상태만 관리합니다. 최종 정답 판정은 서버가 DB의 Question을 읽어 수행합니다.

지원 타입:

- `single_choice`
- `multiple_choice`
- `true_false`
- `short_answer`
- `ordering`

## 8. 확장 방향

MVP 이후 후보:

- 반복 오답 기반 Spaced Repetition
- 문제 Draft / Review / Publish workflow
- AI 생성 API
- Question 품질 리뷰와 신고
- Topic별 그룹 통계
- Question Set 공유 링크

직접 AI 생성보다 Portable Question Format을 먼저 안정화합니다.
