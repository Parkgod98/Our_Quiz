import fs from "node:fs";
import path from "node:path";
import { validateQuestionSet } from "../src/lib/questions/validator.ts";

const requestedFiles = process.argv.slice(2);
const files = requestedFiles.length > 0
  ? requestedFiles
  : fs.readdirSync("examples")
      .filter((name) => name.endsWith(".json"))
      .map((name) => path.join("examples", name));

for (const file of files) {
  try {
    const bytes = fs.readFileSync(file);
    if (bytes.length > 2_000_000) throw new Error("파일 크기는 2MB 이하여야 해요.");
    const result = validateQuestionSet(JSON.parse(bytes.toString("utf8")));
    if (!result.success) throw new Error(result.errors.join("\n"));
    console.log(`${file}: ${result.data.questions.length}문제 검증 완료`);
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    process.exitCode = 1;
  }
}
