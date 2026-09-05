# 2026-09-05 공유 문제집 조회 버그 수정

## 작업한 내용
- 스터디 운영자가 배정한 문제집을 일반 멤버가 안정적으로 조회하도록 `get_group_assignments` RPC를 추가함.
- 홈에서는 현재 사용자가 참여한 모든 스터디의 배정 문제집을 조회하는 `get_my_group_assignments` RPC를 사용하도록 변경함.
- 그룹 상세와 홈에서 중첩 PostgREST 관계 조회에 의존하던 공유 문제집 로딩 경로를 RPC 기반으로 통일함.
- 조회 실패를 빈 목록으로 오인하지 않고 사용자에게 로딩 실패 상태를 표시하도록 수정함.
- 일반 멤버 계정으로 운영자가 배정한 문제집을 실제 조회하는 E2E를 추가함.

## 이유
- 운영자 화면의 `함께 풀 문제`에는 문제집이 보이지만 동일 그룹의 일반 멤버 화면에서는 보이지 않는 현상이 실제 사용 중 확인됨.
- 기존 Core E2E는 멤버가 배정된 Version으로 풀이를 시작할 수 있는지만 검증했고, 멤버 화면이 배정 목록 자체를 조회하는 경로는 검증하지 않아 사각지대가 있었음.

## 변경 파일
- `supabase/migrations/202609050004_shared_assignment_visibility.sql`
- `src/app/groups/[groupId]/page.tsx`
- `src/app/dashboard/page.tsx`
- `scripts/e2e-shared-assignment.mjs`
- `package.json`

## 검증 계획
- `npm run validate`
- `npm run validate:git`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- PR CI와 Core E2E 통과 후 merge 가능 상태로 전환함.

## 운영 반영
- migration은 PR merge 후 `Supabase Production Migrations` workflow가 자동 적용함.
- SQL Editor 수동 실행은 필요하지 않음.
