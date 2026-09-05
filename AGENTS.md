# Our Quiz Agent Guide

이 파일은 **모든 Coding Agent가 공유하는 프로젝트 규칙의 진입점**입니다. 긴 규칙을 이 파일에 복사하지 말고, 아래 `docs/`를 Source of Truth로 유지합니다.

## 작업 전 반드시 읽기

1. `docs/product-spec.md`
2. `ARCHITECTURE.md`
3. `docs/question-format.md`
4. `docs/security.md`
5. `docs/git-conventions.md`
6. `docs/work-logs/README.md`와 가장 최근 작업 로그
7. 현재 작업과 관련된 `docs/plans/` 문서가 있으면 해당 문서

## 제품 원칙

- 문제 세트의 Version과 과거 Attempt 기록은 변경 불가능한 학습 이력으로 취급합니다.
- 같은 스터디 세션에서는 두 사용자가 동일한 `question_set_version`을 풀어야 합니다.
- Question ID, Topic, 정답, 해설은 Import 시 검증하고 잘못된 문제를 조용히 보정하지 않습니다.
- 사용자별 답안과 통계는 서버에서 권한을 확인하고 RLS를 우회하지 않습니다.
- AI가 생성한 문제는 곧바로 신뢰하지 않고 Schema Validation을 통과한 뒤 저장합니다.

## 개발 규칙

- Next.js App Router + TypeScript를 사용합니다.
- 기본은 Server Component입니다. 브라우저 상호작용이 있을 때만 Client Component를 사용합니다.
- 데이터 접근은 `src/lib/`에 모으고 UI에서 Supabase 쿼리를 난립시키지 않습니다.
- DB 변경은 반드시 `supabase/migrations/`의 새 migration으로 추가합니다. 이미 적용된 migration을 수정하지 않습니다.
- `question_set_versions`와 그 버전에 속한 문제는 Publish 후 불변으로 취급합니다. 수정이 필요하면 새 Version을 만듭니다.
- 정답 판정은 Client가 아니라 Server가 최종 권한을 갖습니다.
- `.env*`, 키, 토큰, 실제 사용자 답안 등 민감 정보는 커밋하지 않습니다.
- 새 의존성은 실제 필요가 있을 때만 추가합니다.

## Harness / 검증 규칙

변경 완료 전 아래를 실행합니다.

```bash
npm run validate
npm run validate:git
npm run lint
npm run build
```

- `npm run validate`는 문제 JSON과 Repository 규칙을 검사합니다.
- `npm run validate:git`은 브랜치/커밋/PR 규칙을 검사합니다. PR 메타데이터 검사는 GitHub Actions에서 완전하게 수행됩니다.
- CI 실패를 무시하거나 검증 코드를 삭제해 통과시키지 않습니다.
- 실패 원인을 해결하고 다시 검증합니다.

## 작업 로그

모든 의미 있는 작업은 `docs/work-logs/YYYY-MM-DD.md`에 기록합니다.

- Asia/Seoul 시간 기준
- 작업 내용 / 이유 / 변경 파일 / 실행한 검증 / 결과 / 남은 점
- 실패한 검증이나 취소한 접근도 기록
- 비밀값은 `[REDACTED]`

## Git

- `main` 직접 작업 금지(저장소 초기화 같은 명시적 예외만 허용)
- 브랜치: `<type>/<english-kebab-case>`
- 커밋: `<type>: <한글 작업 설명>`
- PR 제목도 `<type>: <한글 설명>`이며 **브랜치 type과 PR title type이 같아야 함**
- PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 구조를 그대로 사용
- 기본 Merge 방식은 Squash merge
- GitHub Actions가 브랜치명, PR 제목/본문, 커밋 메시지 형식을 검사함
- Push, PR 생성, Merge, 배포는 사용자의 명시적 요청이 있어야 수행

세부 규칙은 `docs/git-conventions.md`가 Source of Truth입니다.

## Agent 간 규칙 공유

- 이 `AGENTS.md`가 유일한 공통 Agent 규칙 원본입니다.
- Claude Code는 root `CLAUDE.md`에서 `@AGENTS.md`를 import합니다.
- Claude 전용 규칙이 꼭 필요한 경우에만 `CLAUDE.md`에 최소한으로 추가하고 공통 규칙은 복제하지 않습니다.
- 새로운 Agent 도구를 추가할 때도 가능하면 이 파일을 import/참조하도록 구성합니다.
