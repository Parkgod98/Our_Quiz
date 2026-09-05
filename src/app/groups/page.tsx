import { GroupManager } from "@/components/group-manager";

export default function GroupsPage() {
  return <section className="stack"><div><span className="eyebrow">STUDY GROUP</span><h1>같은 Version을 함께 풀기</h1><p>한 명이 만든 그룹의 초대 코드를 상대방이 입력하면 같은 Question Set Version을 배정받을 수 있습니다.</p></div><GroupManager /></section>;
}
