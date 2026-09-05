# Git Conventions

## 목적

사람과 Coding Agent가 같은 규칙으로 브랜치, 커밋, Pull Request를 만들고 CI가 규칙 위반을 기계적으로 차단하도록 합니다.

## 브랜치

형식:

```text
<type>/<english-kebab-case>
```

허용 type:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `ci`

예시:

```text
feat/question-import
fix/attempt-scoring
refactor/supabase-repository
```

규칙:

- 소문자 영문, 숫자, 하이픈만 사용합니다.
- 한 브랜치는 하나의 목적만 가집니다.
- 일반 작업은 최신 `main`에서 시작합니다.
- `main`에 직접 커밋하지 않습니다.

## 커밋

형식:

```text
<type>: <한글로 구체적인 설명>
```

예시:

```text
feat: 문제 JSON Import 기능 추가
fix: 복수 정답 채점 순서 의존성 제거
ci: Git 규칙 검증 단계 추가
```

규칙:

- 첫 줄은 반드시 허용된 type으로 시작합니다.
- 설명에는 한글을 포함하고 무엇을 했는지 구체적으로 씁니다.
- `update`, `수정`, `작업`처럼 의미가 불분명한 설명만 쓰지 않습니다.
- 한 커밋에는 하나의 논리적 목적을 담습니다.

## Pull Request

제목:

```text
<type>: <한글 설명>
```

**PR 제목의 type은 브랜치 type과 같아야 합니다.**

예:

```text
브랜치: feat/question-import
PR 제목: feat: 문제 JSON Import 기능 추가
```

본문에는 아래 네 섹션이 모두 있어야 합니다.

```md
## 변경 내용
- ...

## 검증
- [ ] `npm run validate`
- [ ] `npm run validate:git`
- [ ] `npm run lint`
- [ ] `npm run build`

## 데이터 / 보안 확인
- ...

## 참고
- ...
```

`.github/PULL_REQUEST_TEMPLATE.md`를 그대로 사용합니다.

## Merge 전략

기본 Merge 방식은 **Squash merge**를 권장합니다.

- 브랜치 안에서는 작업 단위별 커밋을 자유롭게 남길 수 있습니다.
- PR이 `main`에 들어갈 때는 하나의 PR 제목으로 Squash하여 `main` 이력을 읽기 쉽게 유지합니다.
- Squash commit 제목은 PR 제목 규칙(`<type>: <한글 설명>`)을 그대로 사용합니다.

## 표준 흐름

```text
git switch main
git pull --ff-only origin main
git switch -c feat/example

# 구현
npm run validate
npm run validate:git
npm run lint
npm run build

git diff --check
git status
git add <files>
git diff --cached --check
git diff --cached
git commit -m "feat: 한글로 구체적인 설명"
git push -u origin feat/example
```

그 다음 GitHub에서 Pull Request를 만들고 CI가 모두 성공한 뒤 Squash merge합니다.

## CI가 자동 검사하는 항목

PR에서 `scripts/validate-git-conventions.mjs`가 다음을 검사합니다.

1. 브랜치명 `<type>/<english-kebab-case>`
2. PR 제목 `<type>: <한글 설명>`
3. 브랜치 type과 PR 제목 type 일치
4. PR 본문의 필수 섹션 존재
5. PR에 포함된 각 커밋 메시지 `<type>: <한글 설명>`

따라서 GPT/Codex와 Claude Code 모두 같은 규칙 문서를 읽고, 규칙을 어기면 CI에서 실패합니다.

## GitHub 저장소 설정에서 추가로 강제할 항목

CI는 형식을 검사하지만 `main` 직접 Push 자체를 막으려면 GitHub Repository Ruleset이 필요합니다.

Repository → Settings → Rules → Rulesets에서 `main` 대상 Ruleset을 만들고 다음을 켭니다.

- Require a pull request before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging (선택)
- Block force pushes
- Restrict deletions

필수 Status Check에는 이 저장소의 `Validate repository, Git policy, lint and build` Job을 지정합니다.

## Agent 규칙

- GPT/Codex는 root `AGENTS.md`를 읽습니다.
- Claude Code는 root `CLAUDE.md`에서 `@AGENTS.md`를 import합니다.
- 공통 Git 규칙은 이 문서만 수정하고 Agent별 파일에 복제하지 않습니다.
