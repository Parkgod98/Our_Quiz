# 2026-09-05 비밀번호 초기화 작업

## 작업한 내용
- 로그인 화면에 `비밀번호 초기화` 진입점을 추가함.
- 이메일, 새 비밀번호, 공유 초기화 코드를 입력해 비밀번호를 재설정할 수 있게 함.
- 서버 Route에서만 Supabase Auth Admin API를 사용해 비밀번호를 변경하도록 구현함.
- `SUPABASE_SECRET_KEY`와 `PASSWORD_RESET_CODE`를 서버 환경 변수로 분리함.
- 배포 및 보안 문서를 갱신함.

## 이유
- 이메일 발송 없이 소규모 스터디 구성원이 계정을 복구할 수 있어야 했음.
- 이메일 주소만 알면 임의 계정의 비밀번호를 바꿀 수 있는 구조는 계정 탈취 위험이 있어, 공유 초기화 코드를 최소 안전장치로 추가함.

## 변경 파일
- `src/components/auth-form.tsx`
- `src/app/api/auth/reset-password/route.ts`
- `.env.example`
- `docs/setup-vercel.md`
- `docs/security.md`

## 검증
- PR CI에서 `validate`, `validate:git`, `lint`, `build`를 확인함.
- 비밀번호 초기화 기능은 Vercel에 서버 전용 환경 변수 2개가 등록된 뒤 실제 운영 환경에서 확인해야 함.

## 배포 전 필요한 값
- `SUPABASE_SECRET_KEY`
- `PASSWORD_RESET_CODE`

비밀값 자체는 저장소에 기록하지 않음.
