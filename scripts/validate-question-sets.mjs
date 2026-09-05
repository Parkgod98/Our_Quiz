import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dirs = [path.join(root, "examples")].filter((dir) => fs.existsSync(dir));
const errors = [];
const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const types = new Set(["single_choice", "multiple_choice", "true_false", "short_answer", "ordering"]);

function checkSet(data, file) {
  if (data?.schemaVersion !== "1.0") errors.push(`${file}: schemaVersion은 1.0이어야 합니다.`);
  if (typeof data?.setId !== "string" || !kebabCase.test(data.setId)) errors.push(`${file}: setId는 kebab-case여야 합니다.`);
  if (!Array.isArray(data?.questions) || data.questions.length === 0) { errors.push(`${file}: questions가 비어 있습니다.`); return; }
  const ids = new Set();
  for (const [index, q] of data.questions.entries()) {
    const prefix = `${file}: questions[${index}]`;
    if (!q || typeof q !== "object") { errors.push(`${prefix}가 object가 아닙니다.`); continue; }
    if (!types.has(q.type)) errors.push(`${prefix}: 지원하지 않는 type '${q.type}'`);
    if (typeof q.id !== "string" || ids.has(q.id)) errors.push(`${prefix}: id가 없거나 중복됩니다.`); else ids.add(q.id);
    if (typeof q.prompt !== "string" || !q.prompt.trim()) errors.push(`${prefix}: prompt가 비어 있습니다.`);
    if (typeof q.explanation !== "string" || !q.explanation.trim()) errors.push(`${prefix}: explanation이 비어 있습니다.`);
  }
}

for (const dir of dirs) {
  for (const name of fs.readdirSync(dir).filter((name) => name.endsWith(".json"))) {
    const file = path.join(dir, name);
    try { checkSet(JSON.parse(fs.readFileSync(file, "utf8")), path.relative(root, file)); }
    catch (error) { errors.push(`${path.relative(root, file)}: JSON parse 실패 - ${error.message}`); }
  }
}

if (errors.length) {
  console.error("Question Set validation failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log("Question Set validation passed.");
