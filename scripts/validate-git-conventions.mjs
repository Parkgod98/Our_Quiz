import fs from "node:fs";
import { execSync } from "node:child_process";

const allowedTypes = ["feat", "fix", "docs", "refactor", "test", "chore", "ci"];
const typePattern = allowedTypes.join("|");
const branchPattern = new RegExp(`^(${typePattern})/[a-z0-9]+(?:-[a-z0-9]+)*$`);
const titlePattern = new RegExp(`^(${typePattern}):\\s+.+[가-힣].*$`);
const commitPattern = new RegExp(`^(${typePattern}):\\s+.+[가-힣].*$`);
const requiredSections = ["## 변경 내용", "## 검증", "## 데이터 / 보안 확인", "## 참고"];
const errors = [];

function readEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return null;
  return JSON.parse(fs.readFileSync(eventPath, "utf8"));
}

function localBranch() {
  try {
    return execSync("git branch --show-current", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const event = readEvent();
const pr = event?.pull_request;
const branch = process.env.GITHUB_HEAD_REF || pr?.head?.ref || localBranch();

if (branch && branch !== "main" && !branchPattern.test(branch)) {
  errors.push(`브랜치명 '${branch}'은 <type>/<english-kebab-case> 형식이어야 합니다.`);
}

if (pr) {
  const title = pr.title ?? "";
  const body = pr.body ?? "";
  if (!titlePattern.test(title)) {
    errors.push(`PR 제목 '${title}'은 <type>: <한글 설명> 형식이어야 합니다.`);
  }

  const branchType = branch.split("/")[0];
  const titleType = title.split(":")[0];
  if (branchType && titleType && branchType !== titleType) {
    errors.push(`브랜치 유형 '${branchType}'과 PR 제목 유형 '${titleType}'이 같아야 합니다.`);
  }

  for (const section of requiredSections) {
    if (!body.includes(section)) errors.push(`PR 본문에 '${section}' 섹션이 필요합니다.`);
  }

  try {
    const baseSha = pr.base.sha;
    execSync(`git fetch --no-tags origin ${baseSha}`, { stdio: "ignore" });
    const messages = execSync(`git log --format=%s ${baseSha}..HEAD`, { encoding: "utf8" })
      .split("\n")
      .map((message) => message.trim())
      .filter(Boolean);

    for (const message of messages) {
      if (!commitPattern.test(message)) {
        errors.push(`커밋 메시지 '${message}'은 <type>: <한글 설명> 형식이어야 합니다.`);
      }
    }
  } catch (error) {
    errors.push(`PR 커밋 메시지를 검증하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (errors.length > 0) {
  console.error("Git convention validation failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Git convention validation passed.");
