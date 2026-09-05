# 2026-09-05 비밀번호 초기화

## 작업 내용
- 기존 PR #10의 공유 초기화 코드 방식은 사용자의 요구와 달라 닫음.
- 로그인 화면에 `비밀번호 초기화` 탭을 추가함.
- 가입 이메일과 새 비밀번호만 입력하면 서버에서 해당 Supabase Auth 계정을 찾아 비밀번호를 갱신하도록 구현함.
- Admin API 사용을 위한 `SUPABASE_SECRET_KEY`만 서버 환경 변수로 사용함.

## 이유
- 서비스 운영 목적이 아니라 두 명이 사용하는 개인 스터디 도구이며, 사용자가 즉시 계정을 복구할 수 있는 단순한 흐름을 원함.

## 변경 파일
- `src/components/auth-form.tsx`
- `src/app/api/auth/reset-password/route.ts`
- `.env.example`

## 검증
- PR CI에서 `validate`, `validate:git`, `lint`, `build`를 확인할 예정.

## 남은 점
- 배포 환경에 `SUPABASE_SECRET_KEY`를 서버 전용 환경 변수로 추가해야 실제 초기화가 동작함.
