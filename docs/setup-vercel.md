# Vercel Setup

## 환경 변수

공개 환경 변수:

```text
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable Key>
```

둘 다 Supabase 브라우저 클라이언트에서 사용하는 공개 설정값입니다. Vercel이 `NEXT_PUBLIC_` prefix를 보고 브라우저에 노출된다고 경고하는 것은 정상입니다.

비밀번호 초기화 기능을 사용할 때만 아래 서버 전용 비밀값을 추가합니다.

```text
SUPABASE_SECRET_KEY=<Supabase Secret Key>
PASSWORD_RESET_CODE=<스터디 구성원끼리 공유할 초기화 코드>
```

`SUPABASE_SECRET_KEY`와 `PASSWORD_RESET_CODE`는 절대로 `NEXT_PUBLIC_` prefix를 붙이지 않고 Vercel Secret으로 저장합니다. `SUPABASE_SECRET_KEY` 대신 기존 프로젝트의 `SUPABASE_SERVICE_ROLE_KEY`를 사용할 수도 있지만 신규 Secret Key 사용을 우선합니다.

## 등록 위치

Vercel Project → Settings → Environment Variables에서 등록합니다.

권장 Target:

- Production
- Preview
- Development

비밀번호 초기화 비밀값은 실제 초기화 기능이 필요한 환경에만 등록합니다.

## Supabase Project URL 찾기

Supabase Project Dashboard에서 상단 **Connect** 버튼을 누르면 Project URL과 Publishable Key를 함께 확인할 수 있습니다.

Project URL 형식:

```text
https://<project-ref>.supabase.co
```

Secret Key는 Supabase Dashboard의 API Keys 화면에서 서버 전용 키를 생성/확인합니다.

## 배포 후 확인

1. Vercel 배포 성공
2. `/auth` 접속
3. 회원가입/로그인 확인
4. `비밀번호 초기화`에서 가입 이메일 + 초기화 코드 + 새 비밀번호 입력
5. 새 비밀번호로 로그인 확인
6. `/groups`, `/import`, `/dashboard` 접근
