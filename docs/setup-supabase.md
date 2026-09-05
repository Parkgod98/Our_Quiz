# Supabase Setup

코드 작업은 끝난 상태를 기준으로, 저장소 소유자는 실제 Supabase 프로젝트만 연결하면 됩니다.

## 1. 프로젝트 생성

Supabase Dashboard에서 새 프로젝트를 만듭니다.

## 2. Migration 적용

프로젝트 SQL Editor에서 아래 파일을 실행합니다.

```text
supabase/migrations/202609050001_initial_schema.sql
```

CLI를 사용한다면 프로젝트 Link 후 `supabase db push` 방식으로 적용해도 됩니다.

## 3. 환경 변수

Supabase의 Connect/API 화면에서 다음 값을 확인합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable Key>
```

로컬은 `.env.local`, Vercel은 Project Settings → Environment Variables에 동일하게 등록합니다.

Service Role Key는 이 MVP에서 필요하지 않습니다.

## 4. Auth 설정

초기에는 Email/Password를 사용합니다. Email Confirmation을 켤 경우 Supabase의 Site URL / Redirect URL에 로컬과 Vercel 주소를 등록합니다.

## 5. 확인

1. `/auth`에서 두 계정을 생성
2. 한 계정으로 `/groups`에서 그룹 생성
3. 다른 계정에서 초대 코드로 참여
4. `/import`에서 `examples/week1-sample.json` 업로드
5. DB의 `question_set_versions`와 `questions` 생성 확인
6. 실제 Version ID로 `/quiz/<version-id>` 접근

## RLS 확인

- 스터디원은 배정된 Version의 문제 본문을 읽을 수 있어야 합니다.
- 스터디원은 `question_answers`를 직접 읽을 수 없어야 합니다.
- 문제 세트 소유자만 정답 포함 Export RPC를 사용할 수 있습니다.
