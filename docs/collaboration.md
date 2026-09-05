# Collaboration Guide

## 공동 개발자가 합류할 때

1. GitHub Repository Collaborator로 초대합니다.
2. 저장소를 Clone합니다.
3. Node.js 24 환경에서 `npm install`을 실행합니다.
4. `.env.example`을 `.env.local`로 복사하고 공유받은 Supabase 공개 설정값만 넣습니다.
5. 작업 시작 전 `AGENTS.md`와 관련 docs를 읽습니다.

## Claude Code 사용자

Claude Code는 프로젝트 루트의 `CLAUDE.md`를 읽습니다. 이 저장소의 `CLAUDE.md`는 `@AGENTS.md`를 import하므로 별도 규칙 복사가 필요 없습니다.

확인은 Claude Code에서 `/context`를 실행해 `CLAUDE.md`가 Memory files에 포함됐는지 확인합니다.

```text
CLAUDE.md
  ↓ import
AGENTS.md
  ↓ pointers
docs/product-spec.md
ARCHITECTURE.md
docs/question-format.md
docs/security.md
docs/git-conventions.md
```

## Codex / GPT 계열 사용자

Repository의 `AGENTS.md`를 진입점으로 사용합니다. 세부 규칙은 동일한 docs를 따릅니다.

## 규칙 변경

공통 규칙을 바꾸려면 `AGENTS.md` 또는 `docs/`의 Source of Truth를 수정합니다. `CLAUDE.md`에 같은 내용을 복붙하지 않습니다.

## 작업 시작 체크리스트

- `main` 최신화
- 관련 제품/아키텍처 문서 확인
- 최신 Work Log 확인
- `<type>/<kebab-case>` 브랜치 생성
- 필요하면 `docs/plans/`에 짧은 구현 계획 추가

## 완료 체크리스트

```bash
npm run validate
npm run lint
npm run build
```

모두 통과한 뒤 PR을 엽니다.
