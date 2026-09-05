import type { PortableQuestionSet } from "@/lib/questions/types";

export const demoQuestionSet: PortableQuestionSet = {
  schemaVersion: "1.0",
  setId: "week1-dram-demo",
  title: "Week 1 DRAM Demo",
  subject: "Semiconductor",
  week: 1,
  version: 1,
  description: "Quiz Player 동작 확인용 5문제",
  questions: [
    {
      id: "dram-refresh-001",
      type: "single_choice",
      topic: "DRAM.Refresh",
      difficulty: 2,
      prompt: "DRAM에 Refresh가 필요한 가장 직접적인 이유는?",
      choices: [
        { id: "a", text: "Capacitor의 전하가 시간이 지나며 누설되기 때문에" },
        { id: "b", text: "CPU Cache와 매번 동기화해야 하기 때문에" },
        { id: "c", text: "NAND처럼 Block Erase가 필요하기 때문에" }
      ],
      answer: "a",
      explanation: "DRAM Cell의 Capacitor 전하는 시간이 지나며 누설되므로 데이터가 사라지기 전에 주기적으로 복원해야 한다."
    },
    {
      id: "dram-cost-002",
      type: "multiple_choice",
      topic: "DRAM.AccessCost",
      difficulty: 3,
      prompt: "DRAM의 실제 접근 비용에 영향을 줄 수 있는 요소를 모두 고르시오.",
      choices: [
        { id: "a", text: "현재 열린 Row" },
        { id: "b", text: "Refresh" },
        { id: "c", text: "Bank 충돌" },
        { id: "d", text: "C 소스 파일 이름" }
      ],
      answer: ["a", "b", "c"],
      explanation: "Row Buffer 상태, Refresh, Bank/Channel 자원 경쟁 등은 실제 메모리 요청 지연에 영향을 줄 수 있다."
    },
    {
      id: "dram-sram-003",
      type: "true_false",
      topic: "Memory.SRAM",
      difficulty: 1,
      prompt: "SRAM은 DRAM과 같은 주기적 Refresh가 필요하지 않으므로 비휘발성 메모리다.",
      answer: false,
      explanation: "SRAM도 전원이 끊기면 데이터가 사라지는 휘발성 메모리다."
    },
    {
      id: "dram-timing-004",
      type: "short_answer",
      topic: "DRAM.Timing.tRCD",
      difficulty: 2,
      prompt: "ACTIVATE 후 READ/WRITE 명령까지의 대표 Timing 이름은?",
      answer: ["tRCD", "trcd"],
      explanation: "tRCD는 Row를 활성화한 뒤 Column 명령을 낼 수 있을 때까지의 지연이다."
    },
    {
      id: "dram-order-005",
      type: "ordering",
      topic: "DRAM.Command",
      difficulty: 3,
      prompt: "같은 Bank의 다른 Row로 이동해 읽을 때 대표 동작 순서를 배열하시오.",
      items: [
        { id: "pre", text: "PRECHARGE" },
        { id: "act", text: "ACTIVATE" },
        { id: "read", text: "READ" }
      ],
      answer: ["pre", "act", "read"],
      explanation: "기존 Row를 닫고(PRECHARGE), 새 Row를 연 뒤(ACTIVATE), 원하는 Column을 읽는다(READ)."
    }
  ]
};
