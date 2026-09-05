# Security

## 원칙

사용자 답안, 이메일, 그룹 정보는 공개 콘텐츠가 아닙니다. 인증된 사용자에게 필요한 최소 범위만 제공합니다.

## Secret

절대 커밋하지 않습니다.

- `.env.local`
- Supabase Service Role Key
- Access Token
- 비밀번호
- 개인 사용자 데이터 Dump

`NEXT_PUBLIC_SUPABASE_ANON_KEY`는 브라우저 사용을 전제로 한 Key지만, 실제 접근 통제는 반드시 RLS가 담당해야 합니다.

## Supabase

- 모든 사용자 데이터 테이블에 RLS를 활성화합니다.
- 클라이언트 요청이 Service Role을 사용하지 않습니다.
- 서버 Route도 기본적으로 로그인 사용자의 JWT + RLS를 사용합니다.
- RLS를 우회하는 Security Definer 함수는 최소화하고 용도를 문서화합니다.
- 그룹 멤버 확인 함수는 검색 경로를 고정합니다.

## Quiz Integrity

시험 진행 중 Client에 정답이 노출될 수 있는 구조를 피합니다. 저장된 `source_json`에는 정답이 포함되므로 실제 Quiz 화면은 DB의 공개용 Question 필드만 읽고, 최종 채점은 서버가 수행하는 방향을 우선합니다.

MVP 데모용 정적 문제는 공개 데이터이므로 이 제한의 대상이 아닙니다.

## Import

- 파일 크기 제한을 둡니다.
- JSON을 Runtime Validator로 검사합니다.
- HTML을 문제 본문으로 실행하지 않고 일반 텍스트로 렌더링합니다.
- Question ID/Topic/Choice ID를 허용된 길이와 문자 집합으로 제한합니다.
