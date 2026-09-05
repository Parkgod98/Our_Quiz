# Initial Foundation Plan

## 목표

Supabase 프로젝트 생성과 Vercel 연결만 남기고, 앱의 코드/DB 계약/검증/CI 기반을 한 PR에서 준비합니다.

## 범위

1. 공통 Agent Harness
2. Portable Question Schema + Validator
3. Next.js App Router 초기 UI
4. Quiz Demo
5. Question Import Validation UI
6. Supabase Auth Client/Server helper
7. PostgreSQL schema + RLS migration
8. Question Import / Attempt API 골격
9. GitHub Actions CI
10. Setup 문서

## 제외

- 실제 Supabase 프로젝트 생성
- 실제 Vercel Project 생성
- 외부 AI API Key 연결
- 공개 운영 데이터 입력

## 완료 조건

```text
npm run validate
npm run lint
npm run build
```

CI가 같은 순서로 통과하고, README만 보고 개발자가 로컬 실행과 Supabase/Vercel 연결을 진행할 수 있어야 합니다.
