# Vercel Setup

## 환경 변수

Our Quiz에서 필요한 공개 환경 변수는 두 개입니다.

```text
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable Key>
```

둘 다 Supabase 브라우저 클라이언트에서 사용하는 공개 설정값입니다. Vercel이 `NEXT_PUBLIC_` prefix를 보고 "브라우저에 노출된다"고 경고하는 것은 정상입니다.

Vercel에서 해당 값을 추가할 때 공개 노출이 의도된 값이므로 **Config**로 저장해도 됩니다.

반대로 아래 값은 절대로 `NEXT_PUBLIC_`으로 만들면 안 됩니다.

```text
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
service_role key
```

이런 서버 전용 비밀값은 현재 MVP에서 사용하지 않습니다.

## 비밀번호 복구 메일

복구 메일은 Supabase Authentication → URL Configuration에 등록된 운영 사이트의 루트(`/`)로 돌아옵니다. 앱이 루트에서 인증 코드를 받으면 내부 콜백에서 세션을 만들고, 복구 요청은 새 비밀번호 화면으로, 일반 인증은 대시보드로 연결합니다. 기본 복구 메일 템플릿은 Supabase의 `{{ .ConfirmationURL }}` 링크를 사용합니다. 스터디원에게 실제 메일을 보내려면 프로젝트에 해당 수신자에게 발송할 수 있는 SMTP를 구성합니다.

사용자가 복구를 요청한 브라우저에서 메일 링크를 열면 앱이 일회용 코드와 해당 브라우저의 검증값으로 인증 세션을 얻습니다. 새 비밀번호는 그 세션으로 로그인한 본인 계정에 저장됩니다. [Supabase 비밀번호 인증 문서](https://supabase.com/docs/guides/auth/passwords)

## 등록 위치

Vercel Project → Settings → Environment Variables에서 두 값을 등록합니다.

권장 Target:

- Production
- Preview
- Development

필요한 환경에 모두 같은 Supabase 프로젝트를 연결할 수 있지만, 나중에 운영/개발 DB를 분리한다면 환경별 값을 나눕니다.

## Supabase Project URL 찾기

Supabase Project Dashboard에서 상단 **Connect** 버튼을 누르면 Project URL과 Publishable Key를 함께 확인할 수 있습니다.

Project URL 형식:

```text
https://<project-ref>.supabase.co
```

## 배포 후 확인

1. Vercel 배포 성공
2. `/auth` 접속
3. 회원가입/로그인
4. `/groups`, `/import`, `/dashboard` 접근
5. Supabase Auth와 DB 기록 확인
