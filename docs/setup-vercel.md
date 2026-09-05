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
