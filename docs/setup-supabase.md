# Supabase Setup

코드 작업은 끝난 상태를 기준으로, 저장소 소유자는 실제 Supabase 프로젝트와 자동 migration 배포에 필요한 값만 최초 1회 연결합니다.

## 1. 프로젝트 생성

Supabase Dashboard에서 새 프로젝트를 만듭니다.

## 2. 운영 Migration은 GitHub Actions로 자동 적용

DB 변경은 `supabase/migrations/`에 새 migration 파일로만 추가합니다. 이미 적용된 migration 파일은 수정하지 않습니다.

`main`에 migration 변경이 merge되면 `.github/workflows/supabase-production.yml`이 자동으로 다음 작업을 수행합니다.

```text
GitHub main merge
→ Supabase CLI로 운영 프로젝트 연결
→ pending migration dry-run
→ supabase db push
→ migration history 기록
```

따라서 이후 스키마 변경 때마다 SQL Editor에서 파일을 복사해 Run하지 않습니다.

### GitHub Actions Secrets — 최초 1회만 등록

Repository의 `Settings → Secrets and variables → Actions → New repository secret`에서 다음 세 값을 등록합니다.

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
SUPABASE_DB_PASSWORD
```

- `SUPABASE_ACCESS_TOKEN`: Supabase 계정의 Personal Access Token
- `SUPABASE_PROJECT_REF`: 현재 프로젝트의 reference ID
- `SUPABASE_DB_PASSWORD`: 프로젝트 생성 시 정한 Database password

이 값은 GitHub Secret으로만 저장하며 코드, 문서, `.env` 파일에 실제 값을 기록하지 않습니다.

초기 `202609050001_initial_schema.sql`을 이미 SQL Editor에서 직접 적용한 기존 프로젝트는 workflow가 최초 실행 시 해당 migration을 `applied` 상태로 migration history에 맞춘 뒤 이후 pending migration만 적용합니다. 초기 migration을 다시 실행하지 않습니다.

Secrets 등록 후 처음 한 번은 GitHub의 `Actions → Supabase Production Migrations → Run workflow`로 실행해 현재 pending migration을 운영 DB에 맞춥니다. 그 이후부터는 `main` merge가 자동 실행합니다.

## 3. 애플리케이션 환경 변수

Supabase의 Connect/API 화면에서 다음 값을 확인합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable Key>
```

로컬은 `.env.local`, Vercel은 Project Settings → Environment Variables에 동일하게 등록합니다.

Service Role Key는 이 MVP에서 필요하지 않습니다.

## 4. Auth 설정

초기에는 Email/Password를 사용하지만 **이메일 확인 절차는 사용하지 않습니다.** Email 로그인 설정에서 가입 직후 세션이 발급되도록 이메일 확인 요구를 비활성화합니다.

목표 동작은 다음과 같습니다.

```text
이메일 + 비밀번호 입력
→ 회원가입
→ 즉시 세션 발급
→ 홈 이동
```

별도의 인증 메일 발송/확인 링크 절차는 사용하지 않습니다.

## 5. 로컬/CI Migration 검증

PR에서는 `.github/workflows/e2e.yml`이 임시 로컬 Supabase를 생성하고 모든 migration을 빈 DB에 처음부터 적용합니다.

Core E2E는 다음 흐름까지 실제 Auth/REST/RPC 호출로 검증합니다.

1. 이메일 확인 없는 사용자 A/B 회원가입
2. 스터디 생성 및 초대 코드 참여
3. 문제집 Import와 스터디 배정
4. 풀이 시작 및 이어 풀기
5. 답안 자동 저장과 다시 볼 문제 복원
6. 서버 최종 채점
7. 그룹 풀이 기록 확인
8. 오답노트 조회와 오답 재채점

운영 데이터나 운영 사용자 계정은 E2E에서 사용하지 않습니다.

## RLS 확인

- 스터디원은 배정된 Version의 문제 본문을 읽을 수 있어야 합니다.
- 스터디원은 `question_answers`를 직접 읽을 수 없어야 합니다.
- 문제 세트 소유자만 정답 포함 Export RPC를 사용할 수 있습니다.
- 그룹 관리 변경은 UI 권한뿐 아니라 RLS에서도 제한합니다.
