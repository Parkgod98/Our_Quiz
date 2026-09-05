# Our Quiz

둘이 같은 문제 세트를 풀고, 개인별 풀이·오답·성취도 변화를 누적해서 보는 스터디용 문제은행 플랫폼입니다.

## 핵심 목표

- AI가 생성한 문제를 **표준 JSON 포맷**으로 가져오고 다시 내보냅니다.
- 한 번 게시한 문제 세트는 **Version**으로 고정해 과거 풀이 기록이 바뀌지 않게 합니다.
- `Start`를 누를 때마다 독립적인 **Attempt**를 만들고 답안·점수·오답을 저장합니다.
- 스터디 그룹의 두 사용자가 **동일한 Question Set Version**을 풉니다.
- Topic별 정확도, 반복 오답, 재풀이 기록을 누적합니다.
- 초기 AI 연동은 파일 Import/Export로 단순하게 유지하고, 필요할 때 직접 생성 API를 붙입니다.

## 기술 스택

- Next.js App Router + TypeScript
- Supabase: PostgreSQL, Auth, Row Level Security
- Vercel: 배포
- GitHub Actions: 정적 검증, lint, build

## 개발 상태

현재는 초기 기반을 구축하는 단계입니다. 앱 코드는 Supabase/Vercel 연결 전에도 빌드할 수 있게 구성하고, 실제 데이터 저장과 인증은 환경 변수를 연결하면 활성화되도록 설계합니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

Supabase 프로젝트 연결 전에는 `/quiz/demo`에서 내장 데모 문제로 Quiz Player를 확인할 수 있습니다.

## 필수 환경 변수

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

서버 관리용 Service Role Key는 현재 MVP에서 사용하지 않습니다. 사용자 권한은 Supabase Auth + RLS로 처리합니다.

## 문제 Import / Export

표준 포맷은 [`docs/question-format.md`](docs/question-format.md)를 기준으로 합니다.

```text
ChatGPT / Claude
      ↓
question-set.json
      ↓
Import → Validate → Publish
      ↓
같은 Version을 스터디원이 풀이
      ↓
Attempt / Answer / 오답 기록
      ↓
Export → AI에 재업로드 → 보강 문제 생성
```

예제는 `examples/week1-sample.json`에 있습니다.

## 저장소 구조

```text
src/
├─ app/                 # App Router 화면과 Route Handler
├─ components/          # 재사용 UI
├─ lib/                 # 문제 스키마, 채점, Supabase 접근
└─ data/                # 데모 데이터

supabase/
└─ migrations/          # DB schema + RLS

scripts/                # 프로젝트 전용 validator
docs/                   # 제품/아키텍처/개발 규칙 Source of Truth
```

## AI Agent 개발 규칙

이 저장소의 AI 작업 규칙 원본은 [`AGENTS.md`](AGENTS.md) 하나입니다.

- OpenAI Codex 계열: `AGENTS.md`를 직접 읽습니다.
- Claude Code: [`CLAUDE.md`](CLAUDE.md)가 `@AGENTS.md`를 import합니다.

따라서 GPT와 Claude용 규칙을 따로 복사해서 관리하지 않습니다. 세부 규칙은 `AGENTS.md`가 가리키는 `docs/` 문서에서 관리합니다.

## Git 작업

일반 작업은 `main`에서 직접 하지 않습니다.

```text
main 최신화
→ feat/fix/docs/... 브랜치
→ 구현
→ npm run validate
→ npm run lint
→ npm run build
→ 규칙에 맞는 커밋
→ Pull Request
```

자세한 규칙은 [`docs/git-conventions.md`](docs/git-conventions.md)를 참고합니다.

## 다음 설정: 저장소 소유자가 해야 할 일

코드가 준비된 뒤 아래 두 외부 연결만 필요합니다.

1. Supabase 프로젝트 생성 후 `.env.local`과 Vercel 환경 변수에 URL / Anon Key 등록
2. Vercel에서 GitHub 저장소를 Import해 배포

DB Migration 적용 순서는 [`docs/setup-supabase.md`](docs/setup-supabase.md)에 정리합니다.
