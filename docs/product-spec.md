# Product Spec

## 사용자

초기 사용자는 같은 기술 스터디를 진행하는 2명입니다. 이후 다른 소규모 스터디에도 확장할 수 있는 구조를 유지합니다.

## 해결하려는 문제

- AI에게 문제를 만들어 달라고 할 때마다 결과 형식이 달라 누적 관리하기 어렵습니다.
- 같은 문제집을 풀어도 누구에게 어떤 문제가 어려웠는지 기록이 흩어집니다.
- 문제를 보강하면 기존 문제집의 점수 기준이 달라질 수 있습니다.
- 오답을 다시 찾아 반복 학습하기 어렵습니다.

## MVP 사용자 흐름

### 문제 등록

1. AI에게 범위와 문제 수를 요청합니다.
2. `Our Quiz Question Set v1` JSON 파일을 받습니다.
3. 사이트에서 Import합니다.
4. Validator가 형식과 정답 구조를 검사합니다.
5. 저장 후 Version을 Publish합니다.
6. 스터디 그룹에 해당 Version을 배정합니다.

### 문제 풀이

1. 사용자가 Week 카드에서 `Start`를 누릅니다.
2. 새 Attempt가 생성됩니다.
3. 문제를 풀고 제출합니다.
4. 서버가 채점합니다.
5. 점수, 답안, Topic별 오답을 저장합니다.

### 복습

- 틀린 문제만 보기
- 반복 오답 보기
- 과거 Attempt 점수 변화 보기
- Topic별 정확도 보기

## MVP 필수 기능

- Email 기반 로그인
- Study Group
- Question Set + Version
- JSON Import / Validation / Export
- 5개 Question Type
- Quiz Player
- Attempt 저장
- 오답 확인
- 개인 점수 History
- 그룹의 동일 Version 공유

## 비목표

초기에는 아래를 하지 않습니다.

- 사이트 내부 AI 문제 자동 생성
- 실시간 대전
- 복잡한 랭킹/게임화
- 공개 문제 마켓
- 관리자용 CMS
- 결제

## 성공 기준

- Week1 100개 이상의 문제를 JSON 한 번으로 Import할 수 있습니다.
- 두 사용자가 같은 Version으로 시험을 시작할 수 있습니다.
- 문제 추가 후 새 Version을 만들어도 이전 점수는 변하지 않습니다.
- 사용자가 자신이 자주 틀리는 Topic을 확인할 수 있습니다.
- Question Set을 다시 Export하여 AI에게 보강 요청할 수 있습니다.
