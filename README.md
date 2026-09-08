# Our Quiz

둘이 같은 문제를 풀고, 각자의 풀이·오답 기록을 쌓아가는 스터디 서비스입니다.

문제집을 한 번 게시하면 Version으로 고정해 과거 풀이 기록의 기준이 바뀌지 않도록 했고, `Attempt` 단위로 이어 풀기와 오답 복습 기록을 남깁니다.

**[서비스 바로가기](https://ourquiz-zeta.vercel.app)**

## 주요 기능

- 문제집 Version 관리
- JSON 문제 Import / Export
- 스터디 생성 · 참여 · 공유 문제집
- 이어 풀기와 자동 저장
- 결과 확인 · 오답노트 · 반복 오답 기록
- 멤버 간 풀이 기록 공유

## 기술

`Next.js` `TypeScript` `Supabase` `PostgreSQL` `RLS` `E2E` `GitHub Actions`

## 개발하면서 고민한 것

### 문제를 수정해도 과거 기록은 바뀌지 않게

문제 내용이 수정되면 이전에 풀었던 결과의 기준까지 달라질 수 있습니다. 그래서 게시된 문제집은 Version으로 고정하고, 각 Attempt가 어떤 Version을 풀었는지 남기도록 설계했습니다.

### 개인 기록과 스터디 공유 데이터의 경계

Supabase RLS로 개인 데이터와 스터디 공유 데이터의 접근 범위를 나눴습니다. 실제 개발 중 권한 경계에서 조회 문제가 발생해 E2E 시나리오를 추가하고 함께 검증했습니다.

### 기능을 만든 뒤 실제 사용 흐름도 다시 보기

화면 전환이 느린 구간은 스터디 상세 조회를 단일 RPC로 합치고, 중복 인증 요청과 불필요한 조회를 줄였습니다. 기능을 추가하는 것보다 실제 사용할 때 걸리는 부분을 줄이는 데도 시간을 썼습니다.

### AI가 만든 문제는 서비스 규칙 안에서만 받기

AI가 만든 문제를 그대로 DB에 넣지 않고, 정해둔 JSON 포맷으로 받아 검증한 뒤 Version으로 게시합니다. 기존 데이터 구조나 과거 기록은 서비스가 통제하도록 했습니다.

자세한 문제 포맷과 개발 규칙은 [`docs/`](docs/)와 [`AGENTS.md`](AGENTS.md)에 정리했습니다.

<details>
<summary>로컬 실행</summary>

```bash
npm install
cp .env.example .env.local
npm run dev
```

</details>

이전 README는 [`docs/legacy/README_2026-09-08.md`](docs/legacy/README_2026-09-08.md)에 보관했습니다.
