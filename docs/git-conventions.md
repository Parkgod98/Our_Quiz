# Git Conventions

## 브랜치

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

## 커밋

```text
<type>: <한글로 구체적인 설명>
```

예시:

```text
feat: 문제 JSON Import 기능 추가
fix: 복수 정답 채점 순서 의존성 제거
ci: 문제 스키마 검증 단계 추가
```

한 커밋은 하나의 논리적 목적을 갖습니다.

## 표준 흐름

```text
git switch main
git pull --ff-only origin main
git switch -c feat/example

# 구현
npm run validate
npm run lint
npm run build

git diff --check
git status
git add <files>
git diff --cached --check
git diff --cached
git commit -m "feat: ..."
```

## PR

제목:

```text
<type>: <한글 설명>
```

본문:

```md
## 변경 내용
- ...

## 검증
- `npm run validate`
- `npm run lint`
- `npm run build`

## 참고
- ...
```

Push / PR / Merge / Deploy는 외부 상태 변경이므로 사용자의 명시적 요청 이후 수행합니다.
