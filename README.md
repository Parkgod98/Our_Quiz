# Our Quiz

둘이 같은 문제를 풀고, 개인별 풀이 · 오답 · 성취도 변화를 누적해서 관리하는 스터디 플랫폼입니다.

[서비스 바로가기](https://ourquiz-zeta.vercel.app)

## 왜 만들었나

스터디를 하다 보면 같은 문제를 풀어도 각자의 풀이 기록과 오답은 흩어지고, 문제를 수정하면 과거 기록의 기준도 함께 바뀌는 문제가 생깁니다.

Our Quiz는 **같은 문제 세트를 같은 버전으로 풀고, 풀이 시점의 상태를 그대로 보존하는 것**을 핵심으로 설계했습니다.

## 핵심 설계

### 1. Question Set Version으로 문제를 고정

한 번 게시한 문제 세트는 Version으로 고정합니다.

```text
Question Set
   └─ Version 1
   └─ Version 2
        ↓
      Attempt
        ↓
      Answer
```

이 구조를 통해 이후 문제를 수정하더라도 과거 풀이 기록이 어떤 문제를 기준으로 만들어졌는지 유지할 수 있습니다.

### 2. Attempt 단위로 풀이 이력 관리

`Start`를 누를 때마다 독립적인 Attempt를 생성하고 답안 · 점수 · 오답을 저장합니다.

- 이어 풀기
- 제출 결과 확인
- 오답 중심 복습
- 반복 오답 추적
- 스터디 멤버 간 풀이 기록 비교

단순히 현재 점수만 저장하는 대신 **시간에 따라 학습 기록이 쌓이는 구조**를 선택했습니다.

### 3. RLS 기반 스터디 데이터 접근 제어

Supabase Auth와 PostgreSQL RLS(Row Level Security)를 이용해 개인 데이터와 스터디 공유 데이터를 구분했습니다.

일반 멤버가 공유 문제집과 기록을 볼 수 있는 범위를 명시적으로 검증하고, 실제로 권한 경계에서 발생한 조회 문제를 수정하며 E2E 시나리오도 추가했습니다.

## 성능과 사용자 흐름 개선

기능 구현 후 실제 사용 흐름에서 반복되는 요청과 느린 화면 전환을 줄였습니다.

- 스터디 상세 조회를 단일 RPC로 통합
- 홈 데이터를 단일 집계 조회로 최적화
- 주요 API의 중복 인증 요청 제거
- 주요 페이지 사전 로딩
- 탭 전환 시 불필요한 조회 제거
- 서버 오류 기록과 사용자 오류 상태 구분

기능 개수보다 **실제 사용 과정의 병목을 찾고 개선하는 과정**을 중요하게 두었습니다.

## AI를 문제 생성 도구로 사용하되 데이터 구조는 서비스가 통제

AI가 생성한 문제는 표준 JSON 포맷으로 Import / Export합니다.

```text
ChatGPT / Claude
      ↓
question-set.json
      ↓
Validate
      ↓
Publish as Version
      ↓
Attempt / Answer 저장
      ↓
오답 Export
      ↓
AI로 보강 문제 생성
```

AI가 직접 DB 구조를 바꾸거나 기존 문제를 덮어쓰는 대신, 서비스가 정의한 포맷과 Version 규칙 안에서만 데이터를 받도록 했습니다.

표준 포맷은 [`docs/question-format.md`](docs/question-format.md)를 기준으로 합니다.

## 개발 프로세스와 자동 검증

이 저장소는 기능 코드뿐 아니라 개발 규칙도 자동으로 검증합니다.

```text
main 최신화
→ feat / fix / docs 브랜치
→ 구현
→ validate
→ Git 규칙 검사
→ lint / build
→ Pull Request
→ E2E / CI
→ Squash merge
```

- `AGENTS.md`: AI 작업 규칙의 단일 기준
- `docs/`: 제품 · 아키텍처 · 개발 규칙 Source of Truth
- GitHub Actions: 브랜치 · 커밋 · PR 규칙 검증
- Supabase Migration: DB 변경 이력 관리 및 자동 적용
- E2E: 핵심 사용자 흐름 검증

AI-assisted development를 사용하더라도 결과물이 정해둔 규칙과 테스트를 통과해야 반영되도록 구성했습니다.

## 주요 기능

- 문제집 생성 및 Version 관리
- JSON Import / Export 및 스키마 검증
- 스터디 생성 · 참여 · 공유 문제집 관리
- Attempt 기반 이어 풀기 및 자동 저장
- 결과 상세 및 오답노트
- 반복 오답 · Topic별 학습 기록
- 멤버 간 풀이 기록 공유
- Supabase Auth · PostgreSQL · RLS
- DB Migration 자동화
- 핵심 사용자 흐름 E2E 테스트
- Git / PR / CI 개발 규칙 자동 검증

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend / Server | Next.js App Router, TypeScript |
| Database / Auth | Supabase, PostgreSQL, RLS |
| Test | E2E Test, 프로젝트 전용 Validator |
| Deployment | Vercel |
| Engineering | GitHub Actions, DB Migration, Harness Engineering |

## 저장소 구조

```text
src/
├─ app/                 # 화면과 Route Handler
├─ components/          # 재사용 UI
├─ lib/                 # 문제 스키마 · 채점 · Supabase 접근
└─ data/                # 데모 데이터

supabase/migrations/    # DB schema + RLS
scripts/                # 프로젝트 전용 validator
docs/                   # 제품 · 아키텍처 · 개발 규칙
examples/               # 문제 JSON 예제
```

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

기존 운영 중심 README는 개발 과정 보존을 위해 [`docs/legacy/README_2026-09-08.md`](docs/legacy/README_2026-09-08.md)에 남겨두었습니다.
