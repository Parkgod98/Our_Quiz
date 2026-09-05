import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "AGENTS.md",
  "CLAUDE.md",
  "ARCHITECTURE.md",
  "docs/product-spec.md",
  "docs/question-format.md",
  "docs/security.md",
  "docs/git-conventions.md",
  "docs/work-logs/README.md",
  "supabase/migrations/202609050001_initial_schema.sql"
];
const errors = [];

for (const relativePath of required) {
  if (!fs.existsSync(path.join(root, relativePath))) errors.push(`필수 파일 누락: ${relativePath}`);
}

const claude = fs.existsSync(path.join(root, "CLAUDE.md")) ? fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8") : "";
if (!/^@AGENTS\.md/m.test(claude)) errors.push("CLAUDE.md는 @AGENTS.md를 import해야 합니다.");

const agents = fs.existsSync(path.join(root, "AGENTS.md")) ? fs.readFileSync(path.join(root, "AGENTS.md"), "utf8") : "";
for (const reference of ["docs/product-spec.md", "ARCHITECTURE.md", "docs/question-format.md", "docs/security.md", "docs/git-conventions.md"]) {
  if (!agents.includes(reference)) errors.push(`AGENTS.md에서 ${reference}를 참조해야 합니다.`);
}

const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
for (const sensitive of [".env.local", "CLAUDE.local.md"]) {
  if (!gitignore.includes(sensitive)) errors.push(`.gitignore에 ${sensitive}가 필요합니다.`);
}

if (errors.length > 0) {
  console.error("Repository harness validation failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log("Repository harness validation passed.");
